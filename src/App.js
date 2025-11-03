import React, { useState, useEffect } from "react";
import "./App.css";

// We'll define the times in seconds
const TASK_ENTRY_DURATION = 300; // 5 minutes
const WIND_DOWN_DURATION = 300; // 5 minutes

function App() {
  // 'setup', 'taskEntry', 'work', 'windDown', 'complete'
  const [phase, setPhase] = useState("setup");

  const [totalSessionMinutes, setTotalSessionMinutes] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // --- CHANGED: Reverted to a simple, empty array. No localStorage. ---
  const [tasks, setTasks] = useState([]);

  const [currentTask, setCurrentTask] = useState("");

  // --- CHANGED: Reverted to a simple 0. No localStorage. ---
  const [completedSessions, setCompletedSessions] = useState(0);

  // --- REMOVED: The useEffect hook that saved 'tasks' to localStorage is gone. ---

  // The main timer logic
  useEffect(() => {
    // Don't run a timer if we are in setup or complete
    if (phase === "setup" || phase === "complete") {
      return;
    }

    // Stop if timer hits 0
    if (secondsLeft === 0) {
      // Move to the next phase
      if (phase === "taskEntry") {
        // Calculate work time: Total (in sec) - 5min task - 5min wind-down
        const workTime =
          totalSessionMinutes * 60 - TASK_ENTRY_DURATION - WIND_DOWN_DURATION;
        setSecondsLeft(workTime > 0 ? workTime : 0); // Ensure work time isn't negative
        setPhase("work");
      } else if (phase === "work") {
        setSecondsLeft(WIND_DOWN_DURATION);
        setPhase("windDown");
      } else if (phase === "windDown") {
        // --- CHANGED: Only update the state, not localStorage ---
        const newCount = completedSessions + 1;
        setCompletedSessions(newCount);
        // localStorage.setItem('completedSessions', JSON.stringify(newCount)); // <-- This line is removed

        setPhase("complete");
      }
      return;
    }

    // The interval tick
    const interval = setInterval(() => {
      setSecondsLeft((prevSeconds) => prevSeconds - 1);
    }, 1000);

    // Clear interval on component unmount or when phase/secondsLeft changes
    return () => clearInterval(interval);

    // --- CHANGED: Removed 'completedSessions' from dependency array
  }, [phase, secondsLeft, totalSessionMinutes]);

  // --- Helper Functions ---

  const handleStartSession = (e) => {
    e.preventDefault();
    if (totalSessionMinutes >= 11) {
      // Need at least 11 mins for 5 + 1 + 5
      setSecondsLeft(TASK_ENTRY_DURATION);
      setPhase("taskEntry");
      setTasks([]); // Clear tasks for the new session
    } else {
      alert("Please enter a session length of at least 11 minutes.");
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (currentTask.trim()) {
      setTasks([
        ...tasks,
        { id: Date.now(), text: currentTask, completed: false },
      ]);
      setCurrentTask(""); // Clear input
    }
  };

  const handleToggleTask = (taskId) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // --- Dynamic Styling (Requirement 5) ---
  const getTimerStyle = () => {
    if (phase !== "work") return {}; // Only apply during work phase

    const workTime =
      totalSessionMinutes * 60 - TASK_ENTRY_DURATION - WIND_DOWN_DURATION;
    const percentageLeft = secondsLeft / workTime;

    let color = "var(--green)";
    if (percentageLeft < 0.5) color = "var(--yellow)";
    if (percentageLeft < 0.2) color = "var(--red)";

    // This creates a smooth transition
    return {
      backgroundColor: color,
      transition: "background-color 2s ease",
    };
  };

  // --- Skip Phase Function ---
  const handleSkipPhase = () => {
    // By setting seconds to 0, we trigger the phase-change logic
    // already present in our useEffect hook.
    setSecondsLeft(0);
  };

  // --- Render Logic (No changes needed here, it reads from state) ---

  const renderContent = () => {
    switch (phase) {
      case "setup":
        return (
          <form onSubmit={handleStartSession}>
            <h2>Start a New Work Session</h2>

            {/* This will now reset to 0 on refresh */}
            <p>
              You have completed <strong>{completedSessions}</strong>{" "}
              {completedSessions === 1 ? "session" : "sessions"} so far. Keep it
              up!
            </p>

            <p>How many total minutes will this session be?</p>
            <div
              style={{
                display: "flex",
                gap: "4px",
                alignItems: "center",
              }}
            >
              <input
                type="number"
                min="11"
                value={totalSessionMinutes}
                onChange={(e) =>
                  setTotalSessionMinutes(parseInt(e.target.value))
                }
                placeholder="e.g., 60"
              />
              <button type="submit">Start Session</button>
            </div>
            <p>(Must be at least 11 minutes)</p>
          </form>
        );

      case "taskEntry":
        return (
          <div>
            <h2>Add Your Tasks</h2>
            <h1>{formatTime(secondsLeft)}</h1>
            <p>You have 5 minutes to list your tasks for this session.</p>
            <form onSubmit={handleAddTask}>
              <input
                type="text"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                placeholder="Add a new task"
              />
              <button type="submit">Add</button>
            </form>
            <ul>
              {tasks.map((task) => (
                <li key={task.id}>{task.text}</li>
              ))}
            </ul>

            <button onClick={handleSkipPhase} className="skip-btn">
              Skip to Work
            </button>
          </div>
        );

      case "work":
        return (
          <div>
            <h2>Time to Work!</h2>
            <h1>{formatTime(secondsLeft)}</h1>
            <h3>Your Task List</h3>
            <ul className="task-list">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={task.completed ? "completed" : ""}
                  onClick={() => handleToggleTask(task.id)}
                >
                  {task.text}
                </li>
              ))}
            </ul>

            <button onClick={handleSkipPhase} className="skip-btn">
              Skip to Wind Down
            </button>
          </div>
        );

      case "windDown":
        return (
          <div>
            <h2>Wind Down</h2>
            <h1>{formatTime(secondsLeft)}</h1>
            <p>Great work! Time to wrap up, review, and relax.</p>

            <button onClick={handleSkipPhase} className="skip-btn">
              Finish Session
            </button>
          </div>
        );

      case "complete":
        return (
          <div>
            <h2>Session Complete!</h2>
            <p>You finished your {totalSessionMinutes} minute session.</p>

            <p>
              Total sessions completed: <strong>{completedSessions}</strong>
            </p>

            <button onClick={() => setPhase("setup")}>Start Another</button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="App" style={getTimerStyle()}>
      <div className="container">{renderContent()}</div>
    </div>
  );
}

export default App;
