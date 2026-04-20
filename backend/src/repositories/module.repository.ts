import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import type { DbModule } from '../database/JsonDatabase';
import type { CreateModuleDto } from '../app/modules/contents/contents.schema';

export const moduleRepository = {
  findAll(): DbModule[] {
    return db.read().modules.slice().sort((a, b) => a.order - b.order);
  },

  findById(id: string): DbModule | undefined {
    return db.read().modules.find((m) => m.id === id);
  },

  exists(id: string): boolean {
    return db.read().modules.some((m) => m.id === id);
  },

  create(dto: CreateModuleDto): DbModule {
    const module: DbModule = {
      id: uuidv4(),
      name: dto.name,
      ...(dto.description && { description: dto.description }),
      order: dto.order,
      createdAt: new Date().toISOString(),
    };
    db.write((data) => ({ ...data, modules: [...data.modules, module] }));
    return module;
  },
};
