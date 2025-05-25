import { useEffect, useRef, useState } from "react";
import "./Timer.css";

interface TimerProps {
  total_time: number;
  time_left?: number;
  onTimeEnd?: () => void;
  style?: React.CSSProperties;
}

const Timer = ({ total_time, time_left, onTimeEnd, style }: TimerProps) => {
  const [current, setCurrent] = useState(time_left ?? total_time);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrent(time_left ?? total_time);
  }, [time_left, total_time]);

  useEffect(() => {
    if (current <= 0) {
      if (onTimeEnd) onTimeEnd();
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => {
        if (prev <= 0.1) {
          clearInterval(intervalRef.current!);
          if (onTimeEnd) onTimeEnd();
          return 0;
        }
        return +(prev - 0.1).toFixed(1);
      });
    }, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line
  }, [current, onTimeEnd]);

  const percent = total_time > 0 ? Math.max(0, (current / total_time) * 100) : 0;

  return (
    <div className="timer-bar-root" style={style}>
      <div
        className={"timer-bar " + (percent <= 10 && percent != 0 && "timer-bar-danger")}
        style={{
          width: `${percent}%`,
        }}
      />
      <span className="timer-bar-label">⏱ {current.toFixed(1)} сек</span>
    </div>
  );
};

export default Timer;
