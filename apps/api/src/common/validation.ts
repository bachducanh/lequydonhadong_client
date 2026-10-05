import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

/** Tên tiếng Việt của các trường thường gặp, dùng trong thông báo lỗi. */
const LABELS: Record<string, string> = {
  title: 'Tiêu đề', name: 'Tên', fullName: 'Họ tên', username: 'Tên đăng nhập', email: 'Email', password: 'Mật khẩu',
  newPassword: 'Mật khẩu mới', content: 'Nội dung', question: 'Câu hỏi', answer: 'Câu trả lời', topic: 'Chủ đề',
  role: 'Vai trò', status: 'Trạng thái', type: 'Loại', issuer: 'Cơ quan ban hành', code: 'Số hiệu', category: 'Chuyên mục',
  categoryId: 'Chuyên mục', typeId: 'Kiểu thư viện', text: 'Nội dung', link: 'Liên kết', url: 'Địa chỉ', className: 'Lớp',
  phone: 'Số điện thoại', position: 'Vị trí', order: 'Thứ tự', slug: 'Đường dẫn', excerpt: 'Tóm tắt', badge: 'Nhãn',
  startAt: 'Ngày bắt đầu', endAt: 'Ngày kết thúc', publishedAt: 'Ngày đăng', issuedAt: 'Ngày ban hành', eventDate: 'Ngày sự kiện',
  ids: 'Danh sách', photos: 'Ảnh', page: 'Trang', limit: 'Số mục mỗi trang', askerName: 'Họ tên', refreshToken: 'Phiên đăng nhập',
};

const TEMPLATES: Record<string, (label: string) => string> = {
  isNotEmpty: (l) => `${l} không được để trống`,
  isDefined: (l) => `Thiếu ${l.toLowerCase()}`,
  minLength: (l) => `${l} quá ngắn`,
  maxLength: (l) => `${l} quá dài`,
  isEmail: () => 'Email không hợp lệ',
  isEnum: (l) => `${l} không hợp lệ`,
  isIn: (l) => `${l} không hợp lệ`,
  isDateString: (l) => `${l} không đúng định dạng ngày`,
  isInt: (l) => `${l} phải là số nguyên`,
  isBoolean: (l) => `${l} phải là bật/tắt`,
  isString: (l) => `${l} phải là chuỗi ký tự`,
  isArray: (l) => `${l} phải là danh sách`,
  arrayNotEmpty: (l) => `${l} không được để trống`,
  min: (l) => `${l} quá nhỏ`,
  max: (l) => `${l} quá lớn`,
  matches: (l) => `${l} không đúng định dạng`,
};

function messages(errors: ValidationError[], parent = ''): string[] {
  const out: string[] = [];
  for (const e of errors) {
    const label = LABELS[e.property] ?? (parent ? `${parent}.${e.property}` : e.property);
    for (const [key, msg] of Object.entries(e.constraints ?? {})) {
      // Giữ thông báo đã viết sẵn bằng tiếng Việt; dịch thông báo mặc định (bắt đầu bằng tên trường)
      const isDefault = msg.startsWith(`${e.property} `) || msg.startsWith('each value');
      out.push(isDefault ? (TEMPLATES[key]?.(label) ?? `${label} không hợp lệ`) : msg);
    }
    if (e.children?.length) out.push(...messages(e.children, label));
  }
  return [...new Set(out)];
}

export const validationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) => new BadRequestException(messages(errors)),
  });
