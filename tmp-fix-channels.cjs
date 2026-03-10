const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/features/channels/actions/mutations.ts');
let content = fs.readFileSync(p, 'utf8');

const target1 = `  const [updated] = await db
    .update(channels)
    .set(updateData)
    .where(
      and(
        eq(channels.id, id),
        eq(channels.tenantId, tenantId),
        version !== undefined ? eq(channels.version, version) : undefined
      )
    )
    .returning();

  if (!updated && version !== undefined) {
    throw new AppError('渠道数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
  }

  // P1 Fix: Audit Log
  if (updated) {
      await db.transaction(async (tx) => {
          await AuditService.log(tx, {
            tableName: 'channels',
            recordId: id,
            action: 'UPDATE',
            userId: session.user.id,
            tenantId,
            newValues: updated,
            details: { reason: 'Channel update', updatedFields: Object.keys(updateData) },
          });
        });
  }

  revalidatePath('/channels');
  revalidatePath(\`/channels/\${id}\`);
  logger.info('Channel updated successfully', { channelId: id, tenantId });
  return updated as unknown as ChannelInput; // Safer cast than any`;

const rep1 = `  const updated = await db.transaction(async (tx) => {
    const [result] = await tx
      .update(channels)
      .set(updateData)
      .where(
        and(
          eq(channels.id, id),
          eq(channels.tenantId, tenantId),
          version !== undefined ? eq(channels.version, version) : undefined
        )
      )
      .returning();

    if (!result && version !== undefined) {
      throw new AppError('渠道数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
    }

    if (result) {
      await AuditService.log(tx, {
        tableName: 'channels',
        recordId: id,
        action: 'UPDATE',
        userId: session.user.id,
        tenantId,
        newValues: result as Record<string, unknown>,
        details: { reason: 'Channel update', updatedFields: Object.keys(updateData) },
      });
    }

    return result as typeof channels.$inferSelect;
  });

  revalidatePath('/channels');
  revalidatePath(\`/channels/\${id}\`);
  logger.info('Channel updated successfully', { channelId: id, tenantId });
  return updated as unknown as ChannelInput; // Safer cast than any`;

const t1Regex = new RegExp(target1.replace(/\r?\n/g, '\\r?\\n').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\r\?\\n/g, '\\r?\\n'), 'g');
content = content.replace(t1Regex, rep1);

const target2 = `    let newContact;
    await db.transaction(async (tx) => {
        [newContact] = await tx.insert(channelContacts)
        .values({
          ...validated,
          tenantId,
          createdBy: session.user.id,
        })
        .returning();
        await AuditService.log(tx, {
            tableName: 'channel_contacts',
            recordId: newContact.id,
            action: 'CREATE',
            userId: session.user.id,
            tenantId,
            newValues: newContact,
            details: { reason: 'Add channel contact', channelId: validated.channelId },
          });
      });
  // P1 Fix: Audit Log
  revalidatePath(\`/channels/\${validated.channelId}\`);
  return newContact;`;

const rep2 = `  const newContact = await db.transaction(async (tx) => {
    const [contact] = await tx.insert(channelContacts)
      .values({
        ...validated,
        tenantId,
        createdBy: session.user.id,
      })
      .returning();

    await AuditService.log(tx, {
      tableName: 'channel_contacts',
      recordId: contact.id,
      action: 'CREATE',
      userId: session.user.id,
      tenantId,
      newValues: contact as Record<string, unknown>,
      details: { reason: 'Add channel contact', channelId: validated.channelId },
    });

    return contact;
  });

  revalidatePath(\`/channels/\${validated.channelId}\`);
  return newContact;`;

const t2Regex = new RegExp(target2.replace(/\r?\n/g, '\\r?\\n').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\r\?\\n/g, '\\r?\\n'), 'g');
content = content.replace(t2Regex, rep2);

fs.writeFileSync(p, content, 'utf8');
console.log('Script done.');
