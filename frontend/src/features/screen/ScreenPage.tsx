import { useScreenState } from "./useScreenState";
import { JoinPage } from "./JoinPage";
import { QuestionView } from "./QuestionView";
import { ScreenResults } from "./ScreenResults";
import "./Screen.css";

const ScreenPage = () => {
  const screenState = useScreenState();

  return (
    <div className="screen-root">
      {screenState.game_state === "waiting" && <JoinPage screenState={screenState} />}
      {(screenState.game_state === "in_question" || screenState.game_state === "in_answers") && (
        <QuestionView screenState={screenState} />
      )}
      {screenState.game_state === "in_results" && <ScreenResults screenState={screenState} />}
    </div>
  );
};

export default ScreenPage;
