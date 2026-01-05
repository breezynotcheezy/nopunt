import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';

type ScenarioChoice = { id: string; label: string; order: number };

type ScenarioDto = {
  id: string;
  code: string;
  street: string;
  spotType: string;
  prompt: any;
  choices: ScenarioChoice[];
};

export default function DrillScreen() {
  const { token } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [drillId, setDrillId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioDto | null>(null);

  const [summary, setSummary] = useState<{ decisionsCount: number; ratingDeltaTotal: number } | null>(null);

  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{
    isCorrect: boolean;
    ratingDelta: number;
    newRating: number;
    newTier: string;
    correctChoiceId: string | null;
    done: boolean;
  } | null>(null);

  const [coachText, setCoachText] = useState<string | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);

  const startedAtMsRef = useRef<number | null>(null);

  const promptLines = useMemo(() => {
    const p = scenario?.prompt;
    if (!p || typeof p !== 'object') return [];

    const street = typeof p.street === 'string' ? p.street : scenario?.street;
    const heroHand = typeof p.heroHand === 'string' ? p.heroHand : '';
    const board = typeof p.board === 'string' ? p.board : '';
    const action = typeof p.action === 'string' ? p.action : '';
    const note = typeof p.note === 'string' ? p.note : '';
    const potBb = typeof p.potBb === 'number' ? `${p.potBb}bb pot` : '';
    const stackBb = typeof p.stackBb === 'number' ? `${p.stackBb}bb stack` : '';

    return [street, heroHand, board, potBb, stackBb, action, note].filter((x) => typeof x === 'string' && x.length > 0);
  }, [scenario]);

  async function start() {
    if (!token) return;
    setError(null);
    setIsLoading(true);
    setCoachText(null);
    setAnswer(null);
    setSummary(null);
    setSelectedChoiceId(null);
    try {
      const res = await apiRequest<{ drillId: string; scenario: ScenarioDto }>({
        path: '/v1/drills/start',
        method: 'POST',
        token,
        body: { maxDecisions: 10 },
      });
      setDrillId(res.drillId);
      setScenario(res.scenario);
      startedAtMsRef.current = Date.now();
    } catch (e: any) {
      setError(e?.body?.error ?? 'Failed to start drill');
    } finally {
      setIsLoading(false);
    }
  }

  async function next() {
    if (!token || !drillId) return;
    setError(null);
    setIsLoading(true);
    setCoachText(null);
    setAnswer(null);
    setSummary(null);
    setSelectedChoiceId(null);
    try {
      const res = await apiRequest<{ done: boolean; scenario?: ScenarioDto; summary?: any }>({
        path: `/v1/drills/${drillId}/next`,
        method: 'GET',
        token,
      });

      if (res.done) {
        setScenario(null);
        setSummary({
          decisionsCount: Number(res.summary?.decisionsCount ?? 0),
          ratingDeltaTotal: Number(res.summary?.ratingDeltaTotal ?? 0),
        });
        return;
      }

      if (!res.scenario) throw new Error('Missing scenario');
      setScenario(res.scenario);
      startedAtMsRef.current = Date.now();
    } catch (e: any) {
      setError(e?.body?.error ?? e?.message ?? 'Failed to load next');
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAnswer() {
    if (!token || !drillId || !scenario || !selectedChoiceId) return;
    setError(null);
    setIsLoading(true);
    setCoachText(null);
    try {
      const responseMs = startedAtMsRef.current ? Date.now() - startedAtMsRef.current : 0;
      const res = await apiRequest<{
        decisionId: string;
        isCorrect: boolean;
        ratingDelta: number;
        newRating: number;
        newTier: string;
        correctChoiceId: string | null;
        done: boolean;
      }>({
        path: `/v1/drills/${drillId}/answer`,
        method: 'POST',
        token,
        body: {
          scenarioId: scenario.id,
          choiceId: selectedChoiceId,
          responseMs,
        },
      });
      setAnswer({
        isCorrect: res.isCorrect,
        ratingDelta: res.ratingDelta,
        newRating: res.newRating,
        newTier: res.newTier,
        correctChoiceId: res.correctChoiceId,
        done: res.done,
      });
    } catch (e: any) {
      setError(e?.body?.error ?? 'Failed to submit answer');
    } finally {
      setIsLoading(false);
    }
  }

  async function askCoach() {
    if (!token || !scenario || !answer || !selectedChoiceId) return;
    setCoachBusy(true);
    setCoachText(null);
    try {
      const res = await apiRequest<{ text: string }>({
        path: '/v1/ai/explain',
        method: 'POST',
        token,
        body: {
          scenario,
          userChoiceId: selectedChoiceId,
          correctChoiceId: answer.correctChoiceId,
          isCorrect: answer.isCorrect,
        },
      });
      setCoachText(res.text);
    } catch (e: any) {
      setCoachText((e?.body?.error as string) ?? 'Coach unavailable');
    } finally {
      setCoachBusy(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    if (!drillId) {
      void start();
    }
  }, [drillId, token]);

  const done = !scenario && !!summary;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!scenario && !answer?.done ? (
          <Pressable style={styles.primary} onPress={start} disabled={isLoading}>
            <Text style={styles.primaryText}>Start Drill</Text>
          </Pressable>
        ) : null}

        {scenario ? (
          <View style={styles.card}>
            <Text style={styles.kicker}>{scenario.street} · {scenario.spotType}</Text>
            {promptLines.map((line) => (
              <Text key={line} style={styles.promptLine}>
                {line}
              </Text>
            ))}

            <View style={styles.choices}>
              {scenario.choices
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((c) => {
                  const selected = selectedChoiceId === c.id;
                  const disabled = !!answer;
                  return (
                    <Pressable
                      key={c.id}
                      style={[styles.choice, selected && styles.choiceSelected, disabled && styles.choiceDisabled]}
                      onPress={() => setSelectedChoiceId(c.id)}
                      disabled={disabled}
                    >
                      <Text style={styles.choiceText}>{c.label}</Text>
                    </Pressable>
                  );
                })}
            </View>

            {!answer ? (
              <Pressable
                style={[styles.primary, !selectedChoiceId && styles.buttonDisabled]}
                onPress={submitAnswer}
                disabled={!selectedChoiceId || isLoading}
              >
                <Text style={styles.primaryText}>Lock it in</Text>
              </Pressable>
            ) : null}

            {answer ? (
              <View style={styles.feedback}>
                <Text style={[styles.result, answer.isCorrect ? styles.correct : styles.wrong]}>
                  {answer.isCorrect ? 'Correct' : 'Wrong'}
                </Text>
                <Text style={styles.meta}>Δ {answer.ratingDelta} · {answer.newTier} · {answer.newRating}</Text>

                <Pressable style={styles.secondary} onPress={askCoach} disabled={coachBusy}>
                  <Text style={styles.secondaryText}>{coachBusy ? 'Asking…' : 'Ask Coach'}</Text>
                </Pressable>

                {coachText ? <Text style={styles.coach}>{coachText}</Text> : null}

                <Pressable style={styles.primary} onPress={next} disabled={isLoading}>
                  <Text style={styles.primaryText}>{answer.done ? 'Finish' : 'Next'}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {done ? (
          <View style={styles.card}>
            <Text style={styles.result}>Drill complete</Text>
            <Text style={styles.meta}>Decisions: {summary.decisionsCount}</Text>
            <Text style={styles.meta}>Total rating Δ: {summary.ratingDeltaTotal}</Text>

            <Pressable style={styles.primary} onPress={start} disabled={isLoading}>
              <Text style={styles.primaryText}>Start another</Text>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? <ActivityIndicator style={styles.spinner} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  kicker: {
    fontSize: 12,
    opacity: 0.7,
  },
  promptLine: {
    fontSize: 16,
    lineHeight: 22,
  },
  choices: {
    gap: 10,
    marginTop: 6,
  },
  choice: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  choiceSelected: {
    borderColor: '#111827',
    backgroundColor: 'rgba(17,24,39,0.06)',
  },
  choiceDisabled: {
    opacity: 0.7,
  },
  choiceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primary: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
  secondary: {
    backgroundColor: 'rgba(17,24,39,0.08)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryText: {
    fontWeight: '700',
    fontSize: 14,
  },
  feedback: {
    marginTop: 12,
    gap: 6,
  },
  result: {
    fontSize: 22,
    fontWeight: '900',
  },
  correct: {
    color: '#059669',
  },
  wrong: {
    color: '#dc2626',
  },
  meta: {
    opacity: 0.75,
  },
  coach: {
    marginTop: 10,
    lineHeight: 20,
  },
  error: {
    color: '#dc2626',
    marginBottom: 4,
  },
  spinner: {
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
