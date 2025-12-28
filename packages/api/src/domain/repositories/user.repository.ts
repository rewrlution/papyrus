import type { Prisma, User } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

/**
 * User Repository
 * all user database operations go through this repository
 */
export const userRepository = {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findByVerificationToken(token: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { verificationToken: token } });
  },

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },

  async delete(id: string): Promise<User> {
    return prisma.user.delete({ where: { id } });
  },
};
