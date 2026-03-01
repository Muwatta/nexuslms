import React, { useEffect, useState } from "react";
import api from "../api";

interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}
interface Question {
  id: number;
  text: string;
  choices: string[];
}

const Quizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selected, setSelected] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    api.get("/quizzes/").then((res) => setQuizzes(res.data));
  }, []);

  const take = (quiz: Quiz) => {
    setSelected(quiz);
    setAnswers({});
    setResult(null);
  };

  const handleAnswer = (qid: number, idx: number) => {
    setAnswers((a) => ({ ...a, [qid]: idx }));
  };

  const submit = async () => {
    if (!selected) return;
    const payload = {
      quiz: selected.id,
      student: 0, // backend should ignore or set from request
      answers,
    };
    const resp = await api.post(`/quiz-submissions/`, payload);
    setResult(resp.data.score);
  };

  if (selected)
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold">{selected.title}</h2>
        {selected.questions.map((q) => (
          <div key={q.id} className="mt-4">
            <p className="font-semibold">{q.text}</p>
            {q.choices.map((c, i) => (
              <label key={i} className="block">
                <input
                  type="radio"
                  name={`q${q.id}`}
                  onChange={() => handleAnswer(q.id, i)}
                />{" "}
                {c}
              </label>
            ))}
          </div>
        ))}
        <button
          onClick={submit}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Submit
        </button>
        {result !== null && <p className="mt-4">Score: {result}</p>}
      </div>
    );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Available Quizzes</h2>
      <ul className="mt-4 space-y-2">
        {quizzes.map((q) => (
          <li key={q.id}>
            <button onClick={() => take(q)} className="text-blue-600 underline">
              {q.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Quizzes;
