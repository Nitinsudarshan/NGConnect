'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** What a batched job's step returns: whether it finished, and how long to wait before the next call. */
export interface JobStepResult {
  done: boolean;
  waitMs?: number;
}

const MAX_CONSECUTIVE_ERRORS = 3;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Drives a server job that runs a batch per request (a Coursera refresh or a
 * prune): calls `step` until it reports done, honours `waitMs` (rate-limit
 * cooldowns, another tab working), and retries a failed request a few times
 * before giving up. `stop()` ends the loop after the current request; the job
 * itself stays resumable on the server.
 */
export const useJobLoop = () => {
  const isCancelled = useRef(false);
  const [isRunning, setIsRunning] = useState(false);

  // Stop polling if the component unmounts mid-job.
  useEffect(() => () => {
    isCancelled.current = true;
  }, []);

  const run = useCallback(async <T extends JobStepResult>(step: () => Promise<T>, onProgress: (result: T) => void): Promise<T | null> => {
    isCancelled.current = false;
    setIsRunning(true);
    let errors = 0;
    try {
      while (!isCancelled.current) {
        try {
          const result = await step();
          errors = 0;
          onProgress(result);
          if (result.done) return result;
          if (result.waitMs) await sleep(result.waitMs);
        } catch (err: unknown) {
          errors++;
          if (errors >= MAX_CONSECUTIVE_ERRORS) throw err;
          await sleep(3000 * errors);
        }
      }
      return null;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const stop = useCallback(() => {
    isCancelled.current = true;
  }, []);

  return { run, stop, isRunning };
};
