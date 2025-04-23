const successSound = new Audio("/sounds/beep-ok.mp3");
const errorSound = new Audio("/sounds/beep-ko.mp3");

export const playSound = (soundType) => {
  if (soundType === "success") {
    successSound.play().catch((err) => console.error(err));
  } else if (soundType === "error") {
    errorSound.play().catch((err) => console.error(err));
  }
};
