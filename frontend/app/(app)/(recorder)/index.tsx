import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { Link, useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { Audio } from "expo-av";

import { RecordingsContext } from "@/context/RecordingContext";
import Icons from "@/utils/Icons";



// Utility function to format time to HH:MM:SS
const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

export default function AudioRecordingScreen() {
  const { currentRecording, setCurrentRecording, recordings, setRecordings } = useContext(RecordingsContext);
  const navigation = useNavigation();

  const [audioRecording, setAudioRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [playbackTime, setPlaybackTime] = useState(0);
  const [totalPlaybackTime, setTotalPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackRef = useRef<Audio.Sound | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const requestPermissions = async () => 
    {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access microphone is required!");
      }
    };
    requestPermissions();
    return cleanup;
  }, []);

 // Get today's start of the day timestamp (midnight)
 const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to midnight
  return today.getTime(); // Returns timestamp for today's start
};

// Get today's end of the day timestamp (11:59:59 PM)
const getEndOfToday = () => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to the end of the day
  return today.getTime(); // Returns timestamp for today's end
};

// Filter recordings to only include those made today
const getTodaysRecordings = () => {
  const startOfToday = getStartOfToday();
  const endOfToday = getEndOfToday();
  
  return recordings.filter((rec) => rec.id >= startOfToday && rec.id <= endOfToday);
};

const todaysRecordings = getTodaysRecordings(); // Get the filtered recordings

  const cleanup = useCallback(() => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    if (playbackRef.current) 
    {
      playbackRef.current.unloadAsync();
      playbackRef.current = null;
    }
  }, []);

  const startRecording = async () => {
    try 
    {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setAudioRecording(recording);
      setIsRecording(true);
      setRecordingTime(0);

      const newRecording = {
        id: Date.now(),
        name: `Recording ${Date.now()}`,
        duration: "00:00",
      };
      setCurrentRecording(newRecording);

      recordingTimerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } 
    catch (error) { console.error("Error starting recording:", error); }
  };

  const stopRecording = async () => {
    if (!audioRecording) return;
  
    try 
    {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  
      await audioRecording.stopAndUnloadAsync();
      const { sound, status } = await audioRecording.createNewLoadedSoundAsync();
      const formattedDuration = formatTime(Math.floor(status.durationMillis / 1000));
  
      setIsRecording(false);
      setCurrentRecording({
        id: Date.now(),
        name: `Recording-${new Date(Date.now()).toLocaleString('en-GB', { hour12: false }).replace(/[^\d]/g, '').slice(0, 12)}`,
        duration: formattedDuration,
        sound,
        uri: audioRecording.getURI(),
      });
      setAudioRecording(null);
  
      // // Show options to save or discard the recording
      // Alert.alert("Save or Discard", "Do you want to save this recording?", [
      //   {
      //     text: "Discard",
      //     onPress: discardRecording,
      //   },
      //   {
      //     text: "Save",
      //     onPress: saveRecording,
      //   },
      // ]);

    } 
    catch (error) 
    {
      console.error("Error stopping recording:", error);
    }
  };
  
  const saveRecording = async () => {
    if (!currentRecording) return;
  
    try 
    {
      let recordingUri = currentRecording.uri;
  
      // Handle blob URL (for web) - converting it into a proper file URL if necessary
      if (recordingUri.startsWith('blob:')) 
      {
        const response = await fetch(recordingUri);
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);
        recordingUri = objectURL; // Update URI with object URL for web
      }
  
      // For all platforms, we save the recordings in AsyncStorage
      const newRecording = {
        ...currentRecording,
        uri: recordingUri,
      };
  
      // Retrieve the existing list of recordings from AsyncStorage
      const storedRecordings = await AsyncStorage.getItem("recordings");
      const recordingsList = storedRecordings ? JSON.parse(storedRecordings) : [];
  
      // Add the new recording to the list
      const updatedRecordingsList = [...recordingsList, newRecording];
  
      // Save the updated list back to AsyncStorage
      await AsyncStorage.setItem("recordings", JSON.stringify(updatedRecordingsList));
  
      // Update the context/state
      setRecordings(updatedRecordingsList);
      setCurrentRecording(null); // Clear the current recording after saving
      stopPlayback();
    } 
    catch (error) 
    {
      console.error("Error saving recording:", error);
    }
  };   

  const discardRecording = () => {
    setCurrentRecording(null); // Discard the current recording
  };

  const playRecording = async () => {
    if (playbackRef.current) await stopPlayback();

    if (!currentRecording?.sound) return;

    try 
    {
      playbackRef.current = currentRecording.sound;
      const status = await playbackRef.current.getStatusAsync();
      setTotalPlaybackTime(Math.floor(status.durationMillis / 1000));
      setPlaybackTime(0);
      setIsPlaying(true);

      await playbackRef.current.playAsync();

      playbackTimerRef.current = setInterval(async () => 
        {
          const status = await playbackRef.current!.getStatusAsync();
          if (status.isPlaying) 
          {
            setPlaybackTime(Math.floor(status.positionMillis / 1000));
          } 
          else 
          {
            clearInterval(playbackTimerRef.current!);
            setIsPlaying(false);
          }
        }, 1000);
    } 
    catch (error) { console.error("Error playing recording:", error); }
  };

  const stopPlayback = useCallback(async () => {
    if (playbackRef.current) 
    {
      await playbackRef.current.stopAsync();
      clearInterval(playbackTimerRef.current!);
      playbackRef.current = null;
      setPlaybackTime(0);
      setIsPlaying(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      {
        isRecording ? (
        <View style={styles.recorder}>
          
          <Text>{formatTime(recordingTime)}</Text>
          <Pressable style={styles.recNstopBtn}
            onPress={stopRecording}>
            <Icons name="stop" size={32} />
          </Pressable> 

        </View>
      ) : currentRecording ? (
        <View style={styles.recorder}>
          <Text style={styles.title}>Recorded Audio</Text>
          <Text>{currentRecording.name}</Text>
          {/* {!isPlaying && } */}

          {
            isPlaying ? (
              <View>
                <Text>{formatTime(playbackTime)} / {formatTime(totalPlaybackTime)}</Text>
                <Pressable style={styles.recNstopBtn}
                  onPress={stopPlayback}>
                    <Icons name="stop" size={48}/>
                    {/* <Text>⏹️</Text> */}
                </Pressable>  
              </View>
            ) : (
              <>
              <Text>Duration: {currentRecording.duration}</Text>
              <Pressable style={styles.playIcnBtn} onPress={playRecording} >
                <Icons name="play" size={48}/>
                {/* <Text>▶️</Text> */}
              </Pressable>
              </>
            )
          }

          <View style={{ display:"flex", flexDirection:"row", gap: 16 }}>
            <Pressable style={styles.deleteBtn}
              onPress={discardRecording}>
              <Text>Discard</Text>
            </Pressable> 
              
            <Pressable style={styles.saveBtn}
              onPress={saveRecording} >
              <Text>Save</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.recorderMin}>
          <>
            {
              todaysRecordings.length > 0 ? (
              <>
                <Text style={{textAlign:"left", width:"96%", padding:8}}>Today's recordings</Text>
                <FlatList
                  style={styles.recordings}
                    data={[...todaysRecordings].reverse()}
                    renderItem={({ item }) => (
                      <View style={styles.recordingItem}>
                        <Link href={`/playback/${item.id}`}
                          style={styles.itemLink}
                        >
                          {/* <Text style={styles.recordingText}>
                            {item.name}  {item.duration}
                          </Text> */}
                          <View style={styles.itemLink}>
                            <View>
                              <Text style={styles.recordingName}>{item.name}</Text>
                              <Text style={styles.time}>
                                📅 {new Date(item.id).toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Text>
                            </View>
                            <Text style={styles.recordingDuration}>⌛ {item.duration}</Text>
                          </View>
                        </Link>
                      </View>
                    )}

                  keyExtractor={(item) => item.id.toString()}
                />
              </>
            ) : (
              <Text style={styles.noRecordingsText}></Text>
            )}
          </>           

          <View style={styles.recorderMinInner}>
            <Pressable 
              style={styles.recNstopBtn}
              onPress={startRecording}
            >
              {/* <Text>🔴</Text> */}
              <Icons name="microphone" size={48}/>
            </Pressable>
          </View>

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white", // Adding a background color to the container for better visibility
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",  // Centering the title
  },

  saveBtn: {
    padding: 8,
    backgroundColor: "#4CAF50",
    width: 80,
    height: 40,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },

  deleteBtn: {
    padding: 8,
    backgroundColor: "red",
    width: 80,
    height: 40,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },

  recNstopBtn: {
    width: 128,
    height: 128,
    backgroundColor: "#0077FF",
    borderRadius: 128,  // Half the width/height to make it circular
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,  // Adding space above the button for better placement
  },

  playIcnBtn: {
    width: 128,
    height: 128,
    backgroundColor: "#0077FF",
    borderRadius: 128,  // Circular button
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,  // Space above the button
  },

  recorder: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000", // Add shadow for better visibility
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  recorderMin: {    
    width:"100%",
    flex:1, 
    justifyContent: "center",  
    alignItems: "center", 
    

  },

  recorderMinInner: {
    marginVertical:8,
    display: "flex",
    flexDirection: "row", // Align buttons horizontally
    justifyContent: "center",
    width: "100%",  // Take full width of the container
    alignItems: "center", // Align items centrally along the horizontal axis
    elevation:8
  },

  recordings: {
    flex: 1,
    display: "flex",
    flexDirection: "column",    
    backgroundColor:'lightgrey',
    width:"100%",
    padding: 8
  },  

  playbackInfo: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },

  recorderControls: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between", // Space between the buttons
    width: "80%",  // Make the controls take most of the screen width
  },
  recordingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    marginVertical: 5,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  recordingText: {
    flex: 1,
    fontSize: 16,
    color: "black",
  },

  itemLink: {
    display:"flex", 
    flexDirection:"row", 
    justifyContent:"space-between", 
    alignItems:"center",
    width:"100%",  
    padding:4,
  },
  recordingName:{
   fontWeight:"bold"
  },
  recordingDuration:{
    fontWeight:"bold"
  },
  time: {
    color: "grey",
    fontSize:12
  }
  
});

