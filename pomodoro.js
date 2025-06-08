document.addEventListener('DOMContentLoaded', () => {
  //Ensures that  all the code inside the function will run only after the entire html has
  //been loaded and parsed
  // ------------------------------------------------------- ELEMENT SELECTION -------------------------------------------------------------//
  // Display elements for time, session type, and pomodoro count
  const timeDisplay = document.querySelector('.time');
  const sessionTypeDisplay = document.querySelector('.session-type');
  const countDisplay = document.querySelector('.count');

  // Control buttons
  const startBtn = document.querySelector('.start-btn');
  const pauseBtn = document.querySelector('.pause-btn');
  const resetBtn = document.querySelector('.reset-btn');

  // Settings and page sections
  const slidersSettingsBtn = document.querySelector('.sliders-settings-btn');
  const settingsSection = document.querySelector('.settings-section');
  const timerCard = document.querySelector('.timer-card');
  const homeSection = document.querySelector('.home-card');

  // Duration display spans in settings for each session type
  const focusDurationSpan = document.querySelector('[data-session="focus"]').closest('.time-controls')
  .querySelector('.duration-time');
  const shortBreakDurationSpan = document.querySelector('[data-session="short-break"]').closest('.time-controls')
  .querySelector('.duration-time');
  const longBreakDurationSpan = document.querySelector('[data-session="long-break"]').closest('.time-controls')
  .querySelector('.duration-time');

  // Save button inside duration settings
  const saveBtn = document.querySelector('.save');

  //Notification elements
  const customMessageInput = document.getElementById('custom-message');
  const presetSelect = document.getElementById('preset-select'); 
  const saveNotificationBtn = document.getElementById ('save-message');
  const resetNotificationBtn = document.getElementById('reset-message');

  //Message Alert 

   const toastNotification = document.getElementById('toast-notification');
   const toastMessage = document.getElementById('toast-message')

  // ------------------------------------------------------- STATE VARIABLES -------------------------------------------------------------//
  // Convert durations from minutes (in UI spans) to seconds for timer calculations
  let focusDuration = parseInt(focusDurationSpan.textContent, 10) * 60;
  let shortBreakDuration = parseInt(shortBreakDurationSpan.textContent, 10) * 60;
  let longBreakDuration = parseInt(longBreakDurationSpan.textContent, 10) * 60;

  let timer = null;           // To store setInterval ID for controlling the countdown
  let timeLeft = focusDuration;  // Remaining time in current session (seconds)
  let currentSession = 'Focus';  // Tracks current session type: 'Focus', 'Short Break', or 'Long Break'
  let pomodoroCount = 1;          // Count of completed pomodoros in current cycle (max 4 before long break)

  // ------------------------------------------------------- HELPER FUNCTIONS -------------------------------------------------------------//

  /**
   * Converts seconds to MM:SS format for display*/

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }
  /**
   * Starts the countdown timer if not already running.
   * Updates display every second, switches session automatically when time reaches 0.
   */
  function startTimer() {
    if (timer) return;  // Prevent multiple timers running simultaneously

    timer = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateDisplay();
      } else {
        // Session ended: clear current timer and switch sessions automatically
        clearInterval(timer);
        timer = null;
        switchSession();
        updateDisplay();
        startTimer();  // Automatically start the next session
      }
    }, 1000);

    // Update button visibility on start
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
  }

   /*
   * Switches to the next session in the pomodoro cycle:
   * Focus → Short Break (for 3 pomodoros) → Long Break (after 4 pomodoros)
   * Then resets cycle after long break
   */
  function switchSession() {
    if (currentSession === 'Focus') { //Checking for the current session that ended
      if (pomodoroCount < 4) {
        // After focus session, go to short break (if pomodoros < 4)
        showToast(localStorage.getItem(MESSAGE_KEY));
        currentSession = 'Short Break';
        timeLeft = shortBreakDuration;
      } else {
        // After 4th pomodoro, go to long break
        showToast('Great👍! You completed 4 pomodoros, It\'s time for your long break!')
        currentSession = 'Long Break';
        timeLeft = longBreakDuration;
      }
    } else { //Checking if the current section that just ended is not focus
      // After any break, go back to Focus session
      if (currentSession === 'Long Break') {
        // Reset cycle after long break
        pomodoroCount = 1;
      } else {
        // Increment pomodoro count after short break
        pomodoroCount++;
      }
      showToast('Break\'s over! Time to focus.' )
      currentSession = 'Focus';
      timeLeft = focusDuration;
    }
  }

    /**
   * Updates all UI display elements (time, session type, pomodoro count)
   */
  function updateDisplay() {
    timeDisplay.textContent = formatTime(timeLeft);
    sessionTypeDisplay.textContent = currentSession;
    countDisplay.textContent = `Pomodoro ${pomodoroCount} of 4`;
  }

  /**
   * Pauses the countdown timer by clearing the interval.
   */
  function pauseTimer() {
    clearInterval(timer);
    timer = null;

    // Update button visibility on pause
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
  }

  /**
   * Resets the timer and all state variables.
   * Also reads updated durations from the settings UI.
   */
  function resetTimer() {
    clearInterval(timer);
    timer = null;

    // Reset pomodoro count and session type
    pomodoroCount = 1;
    currentSession = 'Focus';

    // Read latest durations from settings (in minutes, convert to seconds)
    focusDuration = parseInt(focusDurationSpan.textContent, 10) * 60;
    shortBreakDuration = parseInt(shortBreakDurationSpan.textContent, 10) * 60;
    longBreakDuration = parseInt(longBreakDurationSpan.textContent, 10) * 60;

    timeLeft = focusDuration;
    updateDisplay();

    // Update buttons on reset
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
  }
  // ------------------------------------------------------- EVENT LISTENERS -------------------------------------------------------------//
  // Increment buttons for duration settings increase (+1 minute)
  const incrementButtons = document.querySelectorAll('.increment-button');
  incrementButtons.forEach(button => {
    button.addEventListener('click', () => {
      const timeSpan = button.closest('.time-controls').querySelector('.duration-time,');
      let currentValue = parseInt(timeSpan.textContent, 10);
      currentValue++;
      timeSpan.textContent = currentValue;
    });
  });

  // Decrement buttons for duration settings decrease (-1 minute), minimum 1 minute
  const decrementButtons = document.querySelectorAll('.decrement-button');
  decrementButtons.forEach(button => {
    button.addEventListener('click', () => {
      const timeSpan = button.closest('.time-controls').querySelector('.duration-time');
      let currentValue = parseInt(timeSpan.textContent, 10);
      if (currentValue > 1) {
        currentValue--;
        timeSpan.textContent = currentValue;
      }
    });
  });

  // Save button in settings applies new durations and resets timer
  saveBtn.addEventListener('click', () => {
    // Update durations in seconds from UI
    focusDuration = parseInt(focusDurationSpan.textContent, 10) * 60;
    shortBreakDuration = parseInt(shortBreakDurationSpan.textContent, 10) * 60;
    longBreakDuration = parseInt(longBreakDurationSpan.textContent, 10) * 60;

    resetTimer();  // Reset timer with new durations

    // Switch back to timer card, hide settings
    settingsSection.style.display = 'none';
    timerCard.style.display = 'block';
  });

  
  // Show settings panel when clicking sliders icon/button
  slidersSettingsBtn.addEventListener('click', () => {
    settingsSection.style.display = 'block';
    timerCard.style.display = 'none';
  });

  // Close settings panel when clicking the close button inside settings
  const closeSettingsBtn = settingsSection.querySelector('.close-btn');
  closeSettingsBtn.addEventListener('click', () => {
    settingsSection.style.display = 'none';
    timerCard.style.display = 'block';
  });

  // Start button starts the timer countdown
  startBtn.addEventListener('click', startTimer);

  // Pause button pauses the timer countdown
  pauseBtn.addEventListener('click', pauseTimer);

  // Reset button resets the timer and states to initial values
  resetBtn.addEventListener('click', resetTimer);

  // Home page "Get Started" button hides home section, shows timer card
  const homeButton = document.querySelector('.home-button');
  homeButton.addEventListener('click', () => {
    homeSection.style.display = 'none';
    timerCard.style.display = 'block';
  });

  //Toggle buttons for notification settings
  document.querySelectorAll('.toggle-switch').forEach(toggleBtn => {
    const toggleSetting = toggleBtn.dataset.setting;

    toggleBtn.addEventListener('click', () => {
      // When clicked, the switch will toggle on/off i.e ; if it has active, remove it and vice versa, will change the appearance visually in CSS
      toggleBtn.classList.toggle('active');
      //Saves the current state in the browser's local storage, saves the key e.g push, sound etc and the state.
      //it will be something like push = true
      localStorage.setItem(toggleSetting, toggleBtn.classList.contains('active')/*returns true or false*/)
    });

    //On page load, restore the already stored toggle state from localStorage
    const savedState = localStorage.getItem(toggleSetting);
    if (savedState === 'true') {
      toggleBtn.classList.add('active');
    } else {
      toggleBtn.classList.remove('active');
    }
  });
   //MESSAGE SECTION
   //A reusable key name to store/receive the custom message from localStorage
   let MESSAGE_KEY = '';

   //On page load, get the saved messsage
   const savedMessage = localStorage.getItem(MESSAGE_KEY);
   if (savedMessage) {
    customMessageInput.value = savedMessage;
   }
   //For when a user picks a preset, we put/populate it in the input
   presetSelect.addEventListener('change', () => {
    if (presetSelect.value) {
      customMessageInput.value = presetSelect.value;
    }
   });

   //Save message settings
   saveNotificationBtn.addEventListener('click', () => {
    const message = customMessageInput.value.trim();
    if (message) {
      localStorage.setItem(MESSAGE_KEY, message);
      alert("Message saved!")
    }
   });

   //Reset to Default button
   resetNotificationBtn.addEventListener('click', () => {
    localStorage.removeItem(MESSAGE_KEY);
    customMessageInput.value = '';
    presetSelect.value = '';
    alert('Message reset to default!');
   });

   function showToast(message) {
    toastMessage.textContent = message;
    toastNotification.classList.remove('hidden');
    //Trigger the slide-in animation 
    setTimeout(() => {
      toastNotification.classList.add('show');
    }, 10);

    //Hide after 5 seconds
    setTimeout(()=> {
      toastNotification.classList.remove('show');
      //Hide completely after animation ends 
      setTimeout(() => {
        toastNotification.classList.add('hidden');
      }, 400)
    }, 4000)
   }
  // ------------------------------------------------------- INITIALIZATION -------------------------------------------------------------//
  // Set initial UI display when page loads
  updateDisplay();

  // Ensure correct button visibility on load 
  startBtn.style.display = 'inline-block';
  pauseBtn.style.display = 'none';
});
