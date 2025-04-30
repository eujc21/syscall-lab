// utils/audioUtils.js

export function detectLowBass(audioElement, onBassDetected, bassThreshold = 150, sensitivity = 0.8) {
    if (!audioElement) {
      console.error("Audio element is required for bass detection.");
      return;
    }
  
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioElement);
  
    source.connect(analyser);
    analyser.connect(audioContext.destination); // Connect analyser to output (optional, for audio to still play)
  
    analyser.fftSize = 2048; // Size of the FFT, determines frequency resolution
    const bufferLength = analyser.frequencyBinCount; // Half of FFT size
    const dataArray = new Uint8Array(bufferLength);
  
    let bassDetected = false; // Flag to prevent rapid re-triggering
  
    function analyzeAudio() {
      if (!audioElement || audioElement.paused) {
        return; // Stop analysis if audio is paused or element is removed
      }
  
      analyser.getByteFrequencyData(dataArray);
  
      let bassSum = 0;
      // Define bass frequency range (adjust as needed, in Hz, roughly corresponding to array indices)
      const lowFrequencyBinStart = 0; // Index 0 is the lowest frequency
      const lowFrequencyBinEnd = 5;  // Adjust this to capture more/less bass range
      const bassBinCount = lowFrequencyBinEnd - lowFrequencyBinStart + 1;
  
  
      for (let i = lowFrequencyBinStart; i <= lowFrequencyBinEnd; i++) {
        bassSum += dataArray[i]; // Sum up the amplitude in the bass range
      }
  
      const averageBassAmplitude = bassSum / bassBinCount;
  
      // Check if average bass amplitude exceeds the threshold
      if (averageBassAmplitude > bassThreshold) {
        if (!bassDetected) { // Prevent rapid triggering
          bassDetected = true;
          onBassDetected(averageBassAmplitude); // Call the callback function, passing bass intensity
          setTimeout(() => { bassDetected = false; }, 100 * (1-sensitivity)); // Debounce/cool-down period, adjust 100ms and sensitivity
        }
      } else {
        bassDetected = false; // Reset bass detection flag when below threshold (optional, depending on desired behavior)
      }
  
      requestAnimationFrame(analyzeAudio); // Continue analysis in the next frame
    }
  
    // Start audio analysis only when audio context is running (after user interaction in some browsers)
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(analyzeAudio); // Resume and then start analysis
    } else {
      analyzeAudio(); // Start analysis immediately if context is already running
    }
  
    return () => { // Return a cleanup function to stop analysis
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
        console.log("Audio context closed, bass detection stopped.");
      }
    };
  }