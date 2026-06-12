export interface PipelineStageDTO {
  value: string;
  ar: string;
  en: string;
}

export interface StageStyleDTO {
  dot: string;
  badge: string;
}

export interface PipelineMeta {
  stage: PipelineStageDTO;
  style: StageStyleDTO;
}
