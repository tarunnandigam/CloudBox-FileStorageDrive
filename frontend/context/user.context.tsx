"use client";
import React, { createContext, useContext, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
}

interface UserContextValue {
  current: User | null;
  session: any;
  signout: () => Promise<void>;
  loading: boolean;
  setUserFromEmail?: (email: string, name?: string) => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading] = useState(false);

  async function signout() {
    setUser(null);
  }

  function setUserFromEmail(email: string, name?: string) {
    setUser({
      id: email,
      email: email,
      name: name || email.split('@')[0]
    });
  }

  return (
    <UserContext.Provider value={{ current: user, session: null, signout, loading, setUserFromEmail }}>
      {props.children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
