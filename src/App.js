import React, { useState, useEffect } from 'react';
import './styles.css';
import { Magic } from 'magic-sdk';
import { AvalancheExtension } from '@magic-ext/avalanche';
import { Avalanche, BN } from 'avalanche';

const magic = new Magic('pk_live_8D40A7E251F283ED', {
  extensions: {
    xchain: new AvalancheExtension({
      rpcUrl: 'https://api.avax-test.network/ext/bc/X',
      chainId: 'X',
      networkId: 5,
    }),
  },
});

export default function App() {
  const [email, setEmail] = useState('');
  const [publicAddress, setPublicAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [sendAmount, setSendAmount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMetadata, setUserMetadata] = useState({});
  const [txHash, setTxHash] = useState('');
  const [sendingTransaction, setSendingTransaction] = useState(false);

  useEffect(() => {
    magic.user.isLoggedIn().then(async magicIsLoggedIn => {
      setIsLoggedIn(magicIsLoggedIn);
      if (magicIsLoggedIn) {
        const metadata = await magic.user.getMetadata();
        getBalance(metadata.publicAddress);
        setPublicAddress(metadata.publicAddress);
        setUserMetadata(metadata);
      }
    });
  }, [isLoggedIn]);

  const getBalance = async address => {
    // AVAX Fuji asset ID
    const assetId = 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK';
    const xchain = getXChain();
    const getBalanceResponse = await xchain.getBalance(address, assetId);
    const bal = new BN(getBalanceResponse.balance);
    setBalance(bal.toString() / 1000000000);
  };

  const getXChain = () => {
    let myNetworkID = 5; 
    let myBlockchainID = 'X';
    let avalanche = new Avalanche(
      new URL('https://api.avax-test.network/ext/bc/X').hostname,
      443,
      'https',
      myNetworkID,
      myBlockchainID,
    );
    return avalanche.XChain();
  };

  const login = async () => {
    await magic.auth.loginWithEmailOTP({ email });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await magic.user.logout();
    setIsLoggedIn(false);
  };

  const handlerSendTransaction = async () => {
    setSendingTransaction(true);
    const metadata = await magic.user.getMetadata();
    const assetId = 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK';
    const xchain = getXChain();

    let fromAddresses = [metadata.publicAddress];
    let toAddresses = [destinationAddress];

    const signedTx = await magic.xchain.signTransaction(
      sendAmount * 100000000,
      assetId,
      toAddresses,
      fromAddresses,
      toAddresses,
    );

    console.log('signedTX', signedTx);

    let txid = await xchain.issueTx(signedTx);
    setSendingTransaction(false);

    setTxHash(`https://testnet.avascan.info/blockchain/x/tx/${txid}`);

    console.log('send transaction', txid);
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <div className="container">
          <h1>Please sign up or login</h1>
          <input
            type="email"
            name="email"
            required="required"
            placeholder="Enter your email"
            onChange={event => {
              setEmail(event.target.value);
            }}
          />
          <button onClick={login}>Send</button>
        </div>
      ) : (
        <div>
          <div className="container">
            <h1>Current user: {userMetadata.email}</h1>
            <button onClick={logout}>Logout</button>
          </div>
          <div className="container">
            <h1>Avalanche address</h1>
            <div className="info">
              <a
                href={`https://testnet.avascan.info/blockchain/x/address/${publicAddress}/transactions`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {publicAddress}
              </a>
          </div>
          </div>
          <div className="container">
            <h1>Balance</h1>
            <div className="info">{balance} avax</div>
          </div>
          <div className="container">
            <h1>Send AVAX Transaction</h1>
            {txHash ? (
              <div>
                <div>Send transaction success</div>
                <div className="info">{txHash}</div>
              </div>
            ) : sendingTransaction ? (
              <div className="sending-status">Sending transaction</div>
            ) : (
              <div />
            )}
            <input
              type="text"
              name="destination"
              className="full-width"
              required="required"
              placeholder="Destination address"
              onChange={event => {
                setDestinationAddress(event.target.value);
              }}
            />
            <input
              type="text"
              name="amount"
              className="full-width"
              required="required"
              placeholder="Amount in AVAX"
              onChange={event => {
                setSendAmount(event.target.value);
              }}
            />
            <button id="btn-send-txn" onClick={handlerSendTransaction}>
              Send Transaction
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
