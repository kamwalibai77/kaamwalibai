import React from "react";
import MobileAuthScreen from "./MobileAuthScreen";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen(props: Props) {
  // Reuse the MobileAuthScreen UI for the Login route so the app uses
  // the single-page OTP flow (send + verify) for authentication.
  return <MobileAuthScreen {...props} />;
}
