export const SizeValidator = {
    validate: (width: number | string, height: number | string) => {
        const w = Number(width);
        const h = Number(height);
        const messages: string[] = [];

        if (w > 1000) messages.push(`宽度 (${w}cm) 超过常规限额，请确认是否输入正确`);
        if (h > 500) messages.push(`高度 (${h}cm) 超过常规限额，请确认是否输入正确`);
        if (w < 10) messages.push(`宽度 (${w}cm) 过小，请确认`);
        if (h < 10) messages.push(`高度 (${h}cm) 过小，请确认`);

        return { isValid: messages.length === 0, messages };
    }
};
