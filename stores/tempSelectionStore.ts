import { observable } from '@legendapp/state';

interface TempSelection {
  instructor: {
    id: string;
    name: string;
  } | null;
}

export const tempSelectionStore$ = observable<TempSelection>({
  instructor: null,
});

export const setTempInstructor = (id: string, name: string) => {
  tempSelectionStore$.instructor.set({ id, name });
};

export const clearTempInstructor = () => {
    tempSelectionStore$.instructor.set(null);
};

export const getTempInstructor = () => tempSelectionStore$.instructor.get();
