declare module 'gifshot' {
    interface CreateGIFOptions {
        images: string[];
        interval?: number;
        gifWidth?: number;
        gifHeight?: number;
        numFrames?: number;
        frameDuration?: number;
        sampleInterval?: number;
        numWorkers?: number;
    }

    interface CreateGIFResult {
        error: boolean;
        errorCode: string;
        errorMsg: string;
        image: string; // Base64 image
    }

    export function createGIF(
        options: CreateGIFOptions,
        callback: (obj: CreateGIFResult) => void
    ): void;
}

