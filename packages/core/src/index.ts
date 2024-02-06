
import { BehaviorSubject, takeUntil, fromEvent, Subject, Observable, share, switchMap, EMPTY } from 'rxjs';
// @ts-ignore
import muxjs from 'mux.js';

export interface DMTVideoLogEvent {
  type: string;
  message: string;
}

export interface DMTVideoAttributes {
  
}

export type DMTVideoFragmentData = Uint8Array;
export type DMTVideoFragment = {
  data: DMTVideoFragmentData,
  index: number;
}

export class DMTMediaSource extends HTMLElement {
  static observedAttributes: Array<keyof DMTVideoAttributes> = [
    "ffmpegBaseHref"
  ];

  destoryRef$$: Subject<void>;
  shadowRoot: ShadowRoot;

  mediaSource: MediaSource;
  sourceBuffer$$: BehaviorSubject<SourceBuffer | null>;
  sourceBufferError$$: Observable<Event>;
  sourceBufferUpdateend$$: Observable<Event>;

  fragments: DMTVideoFragment[];
  currentFragment: number;
  endOfStream$$: BehaviorSubject<boolean>;
  readonly fragmentDuration;

  constructor() {
    super();
    this.destoryRef$$ = new Subject();
    this.shadowRoot = this.attachShadow({ mode: 'open' });
    this.ffmpegReady$$ = new BehaviorSubject(false);
    this.ffmpeg = new FFmpeg();

    this.ffmpegBaseHref$$ = new BehaviorSubject(this.getAttribute('ffmpegBaseHref'));

    this.mediaSource = new MediaSource();
    this.sourceBuffer$$ = new BehaviorSubject<SourceBuffer | null>(null);
    this.sourceBufferError$$ = this.sourceBuffer$$.pipe(
      switchMap((source) => source ? fromEvent<Event>(source, 'error') : EMPTY),
      takeUntil(this.destoryRef$$),
      share(),
    );
    this.sourceBufferUpdateend$$ = this.sourceBuffer$$.pipe(
      switchMap((source) => source ? fromEvent<Event>(source, 'updateend') : EMPTY),
      takeUntil(this.destoryRef$$),
      share(),
    );

    this.fragmentDuration = 5;
    this.fragments = [];
    this.currentFragment = 0;
    this.endOfStream$$ = new BehaviorSubject(false);

    this.nativeVideo.src = URL.createObjectURL(this.mediaSource);

    this.shadowRoot.appendChild(this.nativeVideo);
  }

  protected getFragmentMIME(fragment: DMTVideoFragmentData): string {
    const tracks = muxjs.mp4.probe.tracks(fragment);
    let result = 'video/mp4; codecs="';
    for (let i = 0; i < tracks.length; i++) {
      result += tracks[i].codec;
      if (i < tracks.length - 1) { result += ", "; }
    }
    result += '"';
    return result;
  }

  protected initSourceBuffer(fragment: DMTVideoFragmentData): SourceBuffer {
    this.sourceBuffer = this.mediaSource.addSourceBuffer(this.getFragmentMIME(fragment));
    this.mediaSource.duration = 5;
    return this.sourceBuffer;
  }

  protected async loadFFmpeg(): Promise<void> {
    const ffmpegBaseHref = this.ffmpegBaseHref$$.getValue();
    if (!ffmpegBaseHref) {
      throw new Error('ffmpegBaseHref is required');
    }
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${ffmpegBaseHref}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${ffmpegBaseHref}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${ffmpegBaseHref}/ffmpeg-core.worker.js`, 'text/javascript'),
    });
    this.ffmpegReady$$.next(true);
  }

  protected tryReadFile() {
  }

  protected async readFile() {
    const fragmentFilename = this.currentFragmentFilename;
    const fragment = await this.ffmpeg.readFile(fragmentFilename) as DMTVideoFragmentData;
    this.ffmpeg.deleteFile(fragmentFilename);
    if (this.currentFragment === 0) {
      this.initSourceBuffer(fragment);
    }
    this.fragments.push({
      data: fragment,
      index: this.currentFragment
    });
    this.currentFragment++;
    if (!this.sourceBuffer?.updating) {
      this.addBuffer();
    }
  }

  protected async ffmpegFileExists(filename: string) {
    try {
      const R = await this.ffmpeg.listDir('.');
    } catch (e) {
      return false;
    }
  }

  protected async addBuffer() {
    if (this.fragments.length <= 0) {
      if (this.endOfStream) {
        this.mediaSource.endOfStream();
      }
      return;
    }
    const fragment = this.fragments.shift() as DMTVideoFragment;
    try {
      this.mediaSource.duration = 5 * fragment.index;
    } catch (e) {
      // TODO
    }
    this.sourceBuffer!.timestampOffset = 5 * fragment.index;
    this.sourceBuffer!.appendBuffer(fragment.data.buffer);

    if (this.endOfStream && this.fragments.length === 0) {
      this.mediaSource.endOfStream();
    }
  }

  protected readLast() {

  }

  async connectedCallback() {
    this.sourceBufferUpdateend$$.pipe(
      takeUntil(this.destoryRef$$)
    ).subscribe(() => {
      this.addBuffer();
    })
    await this.loadFFmpeg();
  }

  disconnectCallback() {
    this.destoryRef$$.next();
    this.destoryRef$$.complete();
  }

  attributeChangedCallback<T extends keyof DMTVideoAttributes>(name: T, _oldValue: DMTVideoAttributes[T], newValue: DMTVideoAttributes[T]) {
    if (name === 'ffmpegBaseHref') {
      this.ffmpegBaseHref$$.next(newValue);
    }
  }

  adoptedCallback() { }

  get ffmpegBaseHref() {
    return this.ffmpegBaseHref$$.getValue();
  }

  set ffmpegBaseHref(value: string | null) {
    if (value == null) {
      this.removeAttribute('ffmpegBaseHref');
    } else {
      this.setAttribute('ffmpegBaseHref', value);
    }
  }

  get sourceBuffer(): SourceBuffer | null {
    return this.sourceBuffer$$.getValue();
  }

  set sourceBuffer(s: SourceBuffer | null) {
    this.sourceBuffer$$.next(s);
  }

  get currentFragmentFilename() {
    return `${this.currentFragment}.mp4`;
  }

  get endOfStream() {
    return this.endOfStream$$.getValue();
  }

  set endOfStream(flag: boolean) {
    this.endOfStream$$.next(flag)
  }
}

customElements.define("dmt-video", DMTMediaSource);