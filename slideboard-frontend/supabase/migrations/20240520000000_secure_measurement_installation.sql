-- Enable Row Level Security
ALTER TABLE public.measurement_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installation_orders ENABLE ROW LEVEL SECURITY;

-- Policy for Sales/Admin: Can view all orders
CREATE POLICY "Sales and Admins can view all measurement orders" 
ON public.measurement_orders
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role IN ('admin', 'sales_manager', 'sales')
  )
);

CREATE POLICY "Sales and Admins can view all installation orders" 
ON public.installation_orders
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role IN ('admin', 'sales_manager', 'sales')
  )
);

-- Policy for Surveyors: Can view assigned orders
CREATE POLICY "Surveyors can view assigned measurement orders" 
ON public.measurement_orders
FOR SELECT 
USING (
  measurer_id = auth.uid()
);

-- Policy for Surveyors: Can update assigned orders (e.g. complete, upload photos)
CREATE POLICY "Surveyors can update assigned measurement orders" 
ON public.measurement_orders
FOR UPDATE
USING (
  measurer_id = auth.uid()
)
WITH CHECK (
  measurer_id = auth.uid()
);

-- Policy for Installers: Can view assigned orders
CREATE POLICY "Installers can view assigned installation orders" 
ON public.installation_orders
FOR SELECT 
USING (
  installer_id = auth.uid()
);

-- Policy for Installers: Can update assigned orders
CREATE POLICY "Installers can update assigned installation orders" 
ON public.installation_orders
FOR UPDATE
USING (
  installer_id = auth.uid()
)
WITH CHECK (
  installer_id = auth.uid()
);
