// 获取单个幻灯片
export const fetchSlideById = async (id: string): Promise<any> => {
  const response = await fetch(`/api/slides/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorResponse = await response.json().catch(() => ({}));
    throw new Error(errorResponse.error || '获取幻灯片失败');
  }

  const slideResponse = await response.json();
  return slideResponse.slide;
};

// 获取用户幻灯片列表
export const fetchUserSlides = async (): Promise<any[]> => {
  const response = await fetch('/api/slides', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorResponse = await response.json().catch(() => ({}));
    throw new Error(errorResponse.error || '获取幻灯片列表失败');
  }

  const slidesResponse = await response.json();
  return slidesResponse.slides || [];
};
