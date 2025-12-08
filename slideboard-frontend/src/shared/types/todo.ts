export interface TodoItem {
  id: string;
  type: 'lead' | 'order' | 'task' | 'approval';
  businessId: string;
  businessType: string;
  title: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  dueDate?: Date;
  assigneeId: string;
  assigneeName: string;
  relatedData: {
    orderNumber?: string;
    leadNumber?: string;
    customerName?: string;
    productName?: string;
    contactPhone?: string;
    assignerName?: string;
  };
}

export interface TodoCategory {
  id: string;
  name: string;
  items: TodoItem[];
  count: number;
  icon?: string;
}

export interface GetTodosResponse {
  categories: TodoCategory[];
}
