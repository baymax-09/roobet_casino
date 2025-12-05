export const resourcesRegexQueryCondition = (resources: string[]) => {
  return { $regex: new RegExp('^(' + resources.join('|') + '):') }
}
