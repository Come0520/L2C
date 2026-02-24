import { getShowroomItems } from '@/features/showroom/actions';
import { ShowroomClientPage } from '@/features/showroom/components/showroom-client-page';
import { showroomItemTypeEnum } from '@/shared/api/schema/showroom';

export default async function ShowroomPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const search = (searchParams?.search as string) || '';
  const type = (searchParams?.type as string) || 'all';

  const itemType = type === 'all' ? undefined : (showroomItemTypeEnum.enumValues.find(v => v === type) as typeof showroomItemTypeEnum.enumValues[number] | undefined);

  const result = await getShowroomItems({
    page,
    search,
    type: itemType,
    pageSize: 12,
  });

  return (
    <ShowroomClientPage
      initialData={result.data}
    />
  );
}
