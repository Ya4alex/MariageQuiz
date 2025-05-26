import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import type { ScreenTablesStateEvent } from "../../data/events";
import { categoryMorphMap, type category } from "../../data/models";
import "./ScreenResults.css";

interface ScreenResultsProps {
  screenState: ScreenTablesStateEvent;
}

export const ScreenResults = ({ screenState }: ScreenResultsProps) => {
  const results = screenState.results;
  const { width, height } = useWindowSize();

  if (!results) {
    return (
      <div>
        <h1>Результаты</h1>
        <p>Результаты пока не загружены.</p>
      </div>
    );
  }

  return (
    <>
      <ReactConfetti width={width} height={height} numberOfPieces={600} recycle={true} />
      <div className="screen-reslults-base-container" style={{ position: "relative" }}>
        <h1 className="screen-reslults-title-h1">Победители</h1>
        <div className="screen-reslults-list-container">
          <ol className="screen-reslults-list">
            {results.winers.map((table, idx) => (
              <li key={table.table_id}>
                <div className="screen-results-title">
                  <b>
                    {idx === 0 ? "🥇 " : idx === 1 ? "🥈 " : idx === 2 ? "🥉 " : ""}
                    Стол № {table.table_id} {table.table_name}
                  </b>
                  <span>—</span>
                  <span>{+table.score.toFixed(2)} баллов</span>
                </div>
                <div>
                  {Object.entries(table.categories)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, score]) => (
                      <span key={cat} className="screen-result-info screen-result-box-info">
                        <b>{categoryMorphMap[cat as category]["short"]}:</b> {+score.toFixed(2)}
                      </span>
                    ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
        <h2 className="screen-reslults-title-catrgories-h2">Лучшие по категориям</h2>
        <ul className="screen-results-categories-list">
          {Object.entries(results.category_winners).map(([cat, table]) => (
            <li key={cat}>
              <b>{categoryMorphMap[cat as category]["full"]}:</b>{" "}
              {table ? (
                <>
                  <span>
                    Стол № {table.table_id} {table.table_name}
                  </span>
                  <div className="screen-result-info">
                    {+table.categories[cat as category].toFixed(2)} баллов
                  </div>
                </>
              ) : (
                "Нет победителя"
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
