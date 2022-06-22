wavimport React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import ReactiveButton from 'reactive-button';

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [buttonState, setButtonState] = useState('idle');
  const [numberOfWaves, setNumberOfWaves] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState("");

  const contractAddress = "0x6Ad5b273fA53A10710365CcabB260151AD608515"

  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        setNumberOfWaves(count.toNumber());
        console.log("Retrieved total wave count...", count.toNumber());

        getAllWaves();

      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        setNumberOfWaves(count.toNumber());
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        setButtonState('loading');
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        setButtonState('success');
        setMessage("")
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        setNumberOfWaves(count.toNumber());
        console.log("Retrieved total wave count...", count.toNumber());
        getAllWaves();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setButtonState('error');
      console.log(error);
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        console.log("Retrieving all waves...")
        const waves = await wavePortalContract.getAllWaves();
        console.log("All waves retrieved.")

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    
    let wavePortalContract;
  
    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave); // Subscribe to event calling listener when the event occurs.
    }
  
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave); //Unsubscribe listener to event.
      }
    };
    
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          👋 Hey there!
        </div>

        <div className="bio">
          Sanjeed here. Been waiting for weeks to finally be free to do this!<br/> 
          Here's me on <a href="https://twitter.com/sanjeed_i/status/1539378015842336768" target="_blank">Twitter</a>
        </div>

        <div className="bio">
          Connect your Ethereum wallet and wave at me!<br/>
          If you're lucky enough, you'll receive some fake ETH too!<br/>
          To prevent spam, you can only wave once in a while :)<br/>
        </div>

        {/*
        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        */}

        <div className="messageInputContainer">
          <textarea
            id="message"
            name="message"
            value={message}
            onChange={(event => {setMessage(event.target.value);})}
            placeholder="Enter your message here and wave :)" 
            resize="none"
            outline="none"
          />
        </div>

        <ReactiveButton
          buttonState={buttonState}
          onClick={wave}
          className="waveButton"
          idleText={'Wave at Me'}
          loadingText={'Waving...'}
          successText={'Waved successfully!'}
          errorText={'Error'}
          messageDuration={5000}
          animation={false}
        />

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}


        {(numberOfWaves != "") && (
          <div className="wavesCount">
            Total waves: {numberOfWaves}
          </div>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}

      </div>
    </div>
  );
}

export default App