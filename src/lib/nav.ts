/**
 * Thanh điều hướng — logic thuần.
 *
 * Bong bóng của thanh điều hướng là một phần tử duy nhất trượt từ mục này sang
 * mục kia, nên nó cần biết mục đang chọn nằm ở vị trí thứ mấy. `NavLink` của
 * react-router chỉ cho mỗi link tự biết mình có đang được chọn hay không, không
 * cho ai biết vị trí — nên phần này tự tính, theo đúng luật khớp của `NavLink`.
 */

/** Một mục của thanh điều hướng: đường dẫn, và có phải khớp nguyên văn không. */
export interface NavTarget {
  to: string
  /** Như `end` của `NavLink`: chỉ sáng khi đường dẫn khớp nguyên văn. */
  end: boolean
}

/** Bỏ dấu `/` thừa ở cuối, để `/profile/` và `/profile` là một. */
function trimTrailingSlash(path: string): string {
  if (path.length <= 1) return path
  return path.replace(/\/+$/, '') || '/'
}

/**
 * Vị trí của mục đang được chọn, theo đúng luật của `NavLink`:
 * mục `end` phải khớp nguyên văn, mục khác khớp cả các trang con của nó.
 *
 * Trả `-1` khi không mục nào khớp — bong bóng sẽ ẩn đi thay vì đứng nhầm chỗ.
 */
export function activeNavIndex(pathname: string, targets: readonly NavTarget[]): number {
  const path = trimTrailingSlash(pathname || '/')
  return targets.findIndex(({ to, end }) =>
    end ? path === to : path === to || path.startsWith(`${to}/`),
  )
}
