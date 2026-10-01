import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, Fingerprint, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface AppLockModalProps {
  user: UserProfile;
  onUnlock: (isDuress: boolean) => void;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({ user, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const verifyPin = (enteredPin: string) => {
    if (enteredPin === user.pinCode || enteredPin === '1337') {
      onUnlock(false);
    } else if (enteredPin === user.duressCode || enteredPin === '0000') {
      // Coercion Duress PIN entered: opens safe decoy clean state
      onUnlock(true);
    } else {
      setErrorMsg('Incorrect Passcode');
      setTimeout(() => setPin(''), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B141A] flex flex-col items-center justify-center p-6 text-[#E9EDEF] select-none">
      <div className="w-full max-w-xs flex flex-col items-center text-center">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-full bg-[#00A884]/20 border border-[#00A884]/40 text-[#00A884] flex items-center justify-center mb-6 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-white mb-1">SecureChat Locked</h2>
        <p className="text-xs text-[#8696A0] mb-6">
          Enter 4-digit security PIN or Stealth Duress Code
        </p>

        {/* PIN Dots */}
        <div className="flex items-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                i < pin.length
                  ? 'bg-[#00A884] scale-110 shadow-md shadow-[#00A884]/50'
                  : 'bg-[#202C33] border border-[#2A3942]'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-400 font-medium mb-4 flex items-center gap-1.5 animate-shake">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Bio', '0', '⌫'].map((btn) => {
            if (btn === 'Bio') {
              return (
                <button
                  key={btn}
                  onClick={() => onUnlock(false)}
                  className="h-16 rounded-2xl bg-[#202C33] hover:bg-[#2A3942] active:scale-95 text-emerald-400 flex flex-col items-center justify-center text-xs font-semibold transition-all"
                  title="Unlock with Biometric Pass"
                >
                  <Fingerprint className="w-6 h-6" />
                </button>
              );
            }
            if (btn === '⌫') {
              return (
                <button
                  key={btn}
                  onClick={handleBackspace}
                  className="h-16 rounded-2xl bg-[#202C33] hover:bg-[#2A3942] active:scale-95 text-[#8696A0] flex items-center justify-center text-lg transition-all"
                >
                  ⌫
                </button>
              );
            }
            return (
              <button
                key={btn}
                onClick={() => handleDigit(btn)}
                className="h-16 rounded-2xl bg-[#202C33] hover:bg-[#2A3942] active:scale-95 text-xl font-bold text-white flex items-center justify-center transition-all shadow-sm"
              >
                {btn}
              </button>
            );
          })}
        </div>

        {/* Helpful hint for demonstration */}
        <div className="bg-[#182229] p-3 rounded-xl border border-[#222E35] text-[11px] text-[#8696A0] max-w-xs leading-relaxed">
          💡 <strong className="text-white">Master PIN:</strong> <code className="text-[#00A884]">1337</code> | <strong className="text-white">Duress Decoy:</strong> <code className="text-rose-400">0000</code>
        </div>
      </div>
    </div>
  );
};
