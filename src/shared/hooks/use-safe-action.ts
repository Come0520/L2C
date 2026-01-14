export const useSafeAction = (action: any) => {
    return { execute: async (data: any) => { return action(data); }, status: 'idle' };
};
