import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  searchSpecialists,
  type Specialist,
} from "../services/specialistsApi";

export function useSpecialistSearch(query: string) {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const wordCount = trimmedQuery.split(/\s+/).filter(Boolean).length;
  const [hasSearched, setHasSearched] = useState(false);


  const canSearch =
    trimmedQuery.length >= 3 &&
    trimmedQuery.length <= 100 &&
    wordCount <= 5;

  useEffect(() => {
    let active = true;
    setSpecialists([]);
    setError(null);
    setIsLoading(false);

    if (!canSearch) {
      return;
    }

    // Wait until the user stops typing for 400 ms.
    const timer = setTimeout(async () => {
      setIsLoading(true);

      try {

        setSpecialists([]);
        setError(null);
        setIsLoading(false);
        setHasSearched(false);
        const response = await searchSpecialists(trimmedQuery);

        if (active) {
          setSpecialists(response.data);
          setHasSearched(true);
        }
      } catch (err: unknown) {
        if (!active) return;
        if (isAxiosError(err) && err.response?.status === 429) {
            setError("errors.specialistSearchRateLimit");
            } else {
            setError("errors.searchSpecialists");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [trimmedQuery, canSearch]);

  return {
    specialists,
    isLoading,
    error,
    canSearch,
    hasSearched
  };
}