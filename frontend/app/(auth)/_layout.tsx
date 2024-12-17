import React from 'react'
import { Stack } from 'expo-router'

const Auth_layout = () => {
    return (
        <Stack screenOptions={{ headerShown : false }}>
            <Stack.Screen name='index' />
            <Stack.Screen name='login' />
            <Stack.Screen name='register' />           
        </Stack>
    )
}

export default Auth_layout;
 {/*  */}