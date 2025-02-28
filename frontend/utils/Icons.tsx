
import React from "react";
import type { PropsWithChildren } from "react";
import Icon from "react-native-vector-icons/FontAwesome";

// Define IconProps using `type` with optional `size`
type IconProps = {
    name: string;
    size?: number; // size is optional, will default to 30 if not passed
    color?: string; // Optional color property
  };

//   <Icon name="google" size={32} color = "white" />
  

  const Icons = ({ name, size = 30, color = 'white' }: IconProps) => {
    
    switch (name) {
        case "google":
            return <Icon name="google" size={size} color={color} />
            break;

        case "microphone":
            return <Icon name="microphone" size={size} color={color} />
            break;

        case "play":
            return <Icon name="play" size={30} color={`${color}`} />
            break;

        case "stop":
            return <Icon name="stop" size={30} color={`${color}`} />
            break;

        case "pause":
            return <Icon name="pause" size={30} color={`${color}`} />
            break;
        
        case "rename":
            return <Icon name="rename" size={30} color={`${color}`} />
            break;
        
        case "delete":
            return <Icon name="trash" size={30} color={`${color}`} />
            break;

        case "repeat":
            return <Icon name="repeat" size={30} color={`${color}`} />
            break;

        case "setting":
            return <Icon name="settings" size={30} color={`${color}`} />
            break;

        case "info":
            return <Icon name="info" size={30} color={`${color}`} />
            break;

        case "share":
            return <Icon name="share" size={30} color={`${color}`} />
            break;

        default:
            return <Icon name="pageline" size={30} color={`${color}`} />
            break;
    }
}

export default Icons;

