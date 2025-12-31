import type { Journal, Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

export const journalRespository = {
  /**
   * Find journal by ID (excluding soft-deleted)
   */
  async findById(id: string): Promise<Journal | null> {
    return prisma.journal.findUnique({ where: { id, deletedAt: null } });
  },

  /**
   * Find journal by user and date
   */
  async findByUserAndDate(
    userId: string,
    date: string
  ): Promise<Journal | null> {
    return prisma.journal.findUnique({
      where: { userId_date: { userId, date } },
    });
  },

  /**
   * Find all journals for a user (excluding soft-deleted) in desc order
   */
  async findByUserId(
    userId: string,
    skip: number,
    take: number
  ): Promise<Journal[]> {
    return prisma.journal.findMany({
      where: { userId, deletedAt: null },
      orderBy: { date: 'desc' },
      skip,
      take,
    });
  },

  /**
   * Create a journal entry
   */
  async create(data: Prisma.JournalCreateInput): Promise<Journal> {
    return prisma.journal.create({ data });
  },

  /**
   * Update a journal entry
   */
  async update(id: string, data: Prisma.JournalUpdateInput): Promise<Journal> {
    return prisma.journal.update({ where: { id }, data });
  },

  /**
   * Soft delete a journal entry
   */
  async softDelete(id: string): Promise<Journal> {
    return prisma.journal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  /**
   * Hard delete a journal entry
   */
  async hardDelete(id: string): Promise<Journal> {
    return prisma.journal.delete({ where: { id } });
  },

  /**
   * Count journals for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return prisma.journal.count({ where: { userId, deletedAt: null } });
  },
};
