import React from 'react'
import { Slot, Stack } from "expo-router";
import { SessionProvider } from '@/context/Authcontext';

// import { SessionProvider } from '../ctx';

const auth_layout = () => {
  return (
    <SessionProvider>
        {/* <Stack>        
            <Stack.Screen name="login" 
              options={{ title: "Signin", headerTitleAlign: "center", headerStyle:{ backgroundColor:"wheat"}, headerBackTitleStyle: false }} />
            <Stack.Screen name="register" 
              options={{ title: "Create Account", headerTitleAlign: "center", headerStyle:{ backgroundColor:"wheat"}, headerBackTitleStyle: false }} />
            <Stack.Screen name="+not-found" 
              options={{ title: "404", headerTitleAlign: "center", headerStyle:{ backgroundColor:"wheat"}, headerBackTitleStyle: false }} />
        </Stack> */}
        
        <Slot />
         
    </SessionProvider>
    
  )
}

export default auth_layout;