export const onlineExamPath = /^\/thi-thu\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})(?:\/(de|dap-an))?$/i
export const isExamPage = (path) => path === '/kho-de-thi' || path === '/thi-thu' || onlineExamPath.test(path)
