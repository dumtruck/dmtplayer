export interface DMTCodecs extends Disposable {
  prepare(): Promise<void>;
}