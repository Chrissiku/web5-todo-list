/* eslint-disable react/prop-types */

import { Web5 } from "@web5/api/browser";
import { createContext, useEffect, useState } from "react";

// Create a Web5 context
export const Web5Context = createContext();

//  Web5Provider component
const Web5Provider = ({ children }) => {
  // Initialize the Web5 instance and DID state
  const [web5, setWeb5] = useState(null);
  const [did, setDid] = useState(null);

  // Connect to the Web5 instance when the component mounts
  useEffect(() => {
    const connectWeb5 = async () => {
      // const { web5, did } = await Web5.connect();
      const { web5, did } = await Web5.connect({
        techPreview: {
          dwnEndpoints: ["http://127.0.0.1:5173"],
        },
      });
      setWeb5(web5);
      setDid(did);
    };
    connectWeb5();
  }, []);

  return (
    <Web5Context.Provider value={{ web5, did }}>
      {children}
    </Web5Context.Provider>
  );
};

export default Web5Provider;
