// 文件上传 Mock 数据

// 图片上传 Mock 响应
export const mockUploadImage = {
  data: {
    fileId: "IMG_" + Date.now(),
    fileName: "uploaded-image.jpg",
    fileUrl: "https://via.placeholder.com/800x600/4f46e5/ffffff?text=Uploaded+Image",
    thumbnailUrl: "https://via.placeholder.com/200x150/4f46e5/ffffff?text=Thumbnail",
    fileSize: 1024567, // 字节
    fileType: "image/jpeg",
    width: 800,
    height: 600,
    uploadTime: new Date().toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }),
    uploader: "当前用户"
  },
  code: "200",
  success: true,
  message: "图片上传成功"
}

// 文档上传 Mock 响应
export const mockUploadDocument = {
  data: {
    fileId: "DOC_" + Date.now(),
    fileName: "document.pdf",
    fileUrl: "/files/uploads/document.pdf",
    fileSize: 2048576, // 字节
    fileType: "application/pdf",
    uploadTime: new Date().toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }),
    uploader: "当前用户"
  },
  code: "200",
  success: true,
  message: "文档上传成功"
}

// 批量文件上传 Mock 响应
export const mockBatchUpload = {
  data: {
    successFiles: [
      {
        fileId: "IMG_" + Date.now() + "_1",
        fileName: "image1.jpg",
        fileUrl: "https://via.placeholder.com/800x600/10b981/ffffff?text=Image+1",
        thumbnailUrl: "https://via.placeholder.com/200x150/10b981/ffffff?text=Thumb+1",
        fileSize: 987654,
        fileType: "image/jpeg"
      },
      {
        fileId: "IMG_" + Date.now() + "_2",
        fileName: "image2.png",
        fileUrl: "https://via.placeholder.com/800x600/3b82f6/ffffff?text=Image+2",
        thumbnailUrl: "https://via.placeholder.com/200x150/3b82f6/ffffff?text=Thumb+2",
        fileSize: 1234567,
        fileType: "image/png"
      }
    ],
    failFiles: [],
    successCount: 2,
    failCount: 0,
    uploadTime: new Date().toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    })
  },
  code: "200",
  success: true,
  message: "批量上传成功"
}

// 文件删除 Mock 响应
export const mockDeleteFile = {
  data: {
    fileId: "IMG_1698765432100",
    deleted: true
  },
  code: "200",
  success: true,
  message: "文件删除成功"
}

// 文件列表 Mock 数据
export const mockFileList = {
  data: {
    pageSize: 10,
    pageNum: 1,
    current: 1,
    total: 5,
    list: [
      {
        fileId: "IMG_1698765432100",
        fileName: "banner-image.jpg",
        fileUrl: "https://via.placeholder.com/1200x400/4f46e5/ffffff?text=Banner+Image",
        thumbnailUrl: "https://via.placeholder.com/200x150/4f46e5/ffffff?text=Banner",
        fileSize: 2567890,
        fileType: "image/jpeg",
        width: 1200,
        height: 400,
        uploadTime: "2024-10-25 14:30:00",
        uploader: "张三",
        usageCount: 3
      },
      {
        fileId: "IMG_1698765432101",
        fileName: "product-photo.png",
        fileUrl: "https://via.placeholder.com/600x600/10b981/ffffff?text=Product",
        thumbnailUrl: "https://via.placeholder.com/200x150/10b981/ffffff?text=Product",
        fileSize: 1876543,
        fileType: "image/png",
        width: 600,
        height: 600,
        uploadTime: "2024-10-24 16:45:00",
        uploader: "李四",
        usageCount: 1
      },
      {
        fileId: "DOC_1698765432102",
        fileName: "用户手册.pdf",
        fileUrl: "/files/uploads/user-manual.pdf",
        thumbnailUrl: null,
        fileSize: 3456789,
        fileType: "application/pdf",
        width: null,
        height: null,
        uploadTime: "2024-10-23 10:20:00",
        uploader: "王五",
        usageCount: 7
      },
      {
        fileId: "IMG_1698765432103",
        fileName: "team-photo.jpg",
        fileUrl: "https://via.placeholder.com/800x600/f59e0b/ffffff?text=Team+Photo",
        thumbnailUrl: "https://via.placeholder.com/200x150/f59e0b/ffffff?text=Team",
        fileSize: 1234567,
        fileType: "image/jpeg",
        width: 800,
        height: 600,
        uploadTime: "2024-10-22 13:15:00",
        uploader: "赵六",
        usageCount: 2
      },
      {
        fileId: "DOC_1698765432104",
        fileName: "技术文档.docx",
        fileUrl: "/files/uploads/tech-doc.docx",
        thumbnailUrl: null,
        fileSize: 987654,
        fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        width: null,
        height: null,
        uploadTime: "2024-10-21 09:30:00",
        uploader: "孙七",
        usageCount: 0
      }
    ]
  },
  code: "200",
  success: true,
  message: "查询成功"
}
