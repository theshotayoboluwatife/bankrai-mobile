export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: { email?: string; password?: string; fromRegister?: boolean } | undefined;
  Register: undefined;
  Main: undefined;
};

export type MainStackParamList = {
  Chat: undefined;
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
}; 