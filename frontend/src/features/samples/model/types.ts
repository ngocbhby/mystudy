export interface Sample {
  id: string
  title: string
  subjectCode: string
  topicId: string
  topic: string
  exerciseType: string
  prompt: string
  modelSolution: string
  solutionNote: string
  source: string
}

export interface TopicOption {
  id: string
  name: string
  subjectCode: string
}

export interface SampleList {
  samples: Sample[]
  subjects: string[]
  topics: TopicOption[]
}

export interface SampleFilters {
  subject: string
  topic: string
}
