import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from '@ffmpeg/util';
import { BehaviorSubject, takeUntil, fromEvent, Subject, Observable, share } from 'rxjs';
import { DMTCodecs } from "./defs";

export interface FfmpegLogEvent {
  type: string;
  message: string;
}

export interface DMTFfmpegCodecsOptions {
  ffmpegBaseUrl: string;
}

export class DMTFfmpegCodecs implements DMTCodecs {
  ffmpeg: FFmpeg;
  ffmpegReady$$: BehaviorSubject<boolean>;
  ffmpegMessage$: Observable<FfmpegLogEvent>;
  ffmpegBaseUrl: string;

  destoryRef$$: Subject<void>;

  constructor(options: DMTFfmpegCodecsOptions) {
    this.destoryRef$$ = new Subject();
    this.ffmpeg = new FFmpeg();
    this.ffmpegReady$$ = new BehaviorSubject(false);
    this.ffmpegMessage$ = fromEvent<FfmpegLogEvent>(this.ffmpeg, 'log').pipe(
      takeUntil(this.destoryRef$$),
      share(),
    );
    this.ffmpegBaseUrl = options.ffmpegBaseUrl;
  }

  async prepare() {
    const ffmpegBaseUrl = this.ffmpegBaseUrl;
    const [coreURL, wasmURL, workerURL] = await Promise.all([
      toBlobURL(`${ffmpegBaseUrl}/ffmpeg-core.js`, 'text/javascript'),
      toBlobURL(`${ffmpegBaseUrl}/ffmpeg-core.wasm`, 'application/wasm'),
      toBlobURL(`${ffmpegBaseUrl}/ffmpeg-core.worker.js`, 'text/javascript')
    ])
    await this.ffmpeg.load({
      coreURL,
      wasmURL,
      workerURL,
    });
    this.ffmpegReady$$.next(true);
  }

  static get supported(): boolean {
    return typeof WebAssembly === 'object';
  }

  [Symbol.dispose](): void {
    this.destoryRef$$.next();
  }
}