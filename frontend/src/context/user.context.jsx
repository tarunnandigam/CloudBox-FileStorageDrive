
import React, { createContext, useContext, useState, useEffect } from "react";















const UserContext = createContext(undefined);

export function UserProvider(props) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const savedUser = localStorage.getItem('cloudbox_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('cloudbox_user');
      }
    }
    setLoading(false);
  }, []);

  async function signout() {
    setUser(null);
    localStorage.removeItem('cloudbox_user');
  }

  function setUserFromEmail(email, name) {
    const userData = {
      id: email,
      email: email,
      name: name || email.split('@')[0]
    };
    setUser(userData);
    localStorage.setItem('cloudbox_user', JSON.stringify(userData));
  }

  return (
    <UserContext.Provider value={{ current: user, session: null, signout, loading, setUserFromEmail }}>
      {props.children}
    </UserContext.Provider>);

}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};