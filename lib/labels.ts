export function gradeLabel(g?: string | null) {
  switch (g) {
    case 'grade1': return '一年级'
    case 'grade2': return '二年级'
    case 'grade3': return '三年级'
    case 'grade4': return '四年级'
    case 'grade5': return '五年级'
    case 'grade6': return '六年级'
    default: return ''
  }
}

export function subjectLabel(s?: string | null) {
  switch (s) {
    case 'math': return '数学'
    case 'chinese': return '语文'
    case 'english': return '英语'
    case 'science': return '科学'
    default: return ''
  }
}
