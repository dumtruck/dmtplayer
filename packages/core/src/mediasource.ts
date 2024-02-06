import { Subject } from 'rxjs';
import { DMTFfmpegCodecs, DMTWebCodecs, type DMTFfmpegCodecsOptions, type DMTWebCodecsOptions } from './codecs';

export interface DMTMediaSourceOptions {
  ffmpegCodecsOptions: DMTFfmpegCodecsOptions;
  webCodecsOptions: DMTWebCodecsOptions
}

export class DMTMediaSource implements Disposable {
  destoryRef: Subject<void>;
  ffmpegCodecs: DMTFfmpegCodecs;
  webCodecs: DMTWebCodecs;
  mediaSource: MediaSource;

  constructor(options: DMTMediaSourceOptions) {
    this.destoryRef = new Subject();
    this.ffmpegCodecs = new DMTFfmpegCodecs(options.ffmpegCodecsOptions);
    this.webCodecs = new DMTWebCodecs(options.webCodecsOptions);
    this.mediaSource = new MediaSource();
  }

  addSourceBuffer(mimeCodecs: string): SourceBuffer {
    return this.mediaSource.addSourceBuffer(mimeCodecs);
  }

  static get supported(): boolean {
    return 'MediaSource' in window;
  }

  [Symbol.dispose](): void {
    this.ffmpegCodecs[Symbol.dispose]();
    this.webCodecs[Symbol.dispose]();
    this.destoryRef.next();
  }
}