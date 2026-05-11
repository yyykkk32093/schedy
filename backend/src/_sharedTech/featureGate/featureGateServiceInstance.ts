/**
 * FeatureGateService singleton — アプリ全体で共有
 */
import { prisma } from '@/_sharedTech/db/client.js'
import { FeatureGateService } from '@/domains/_sharedDomains/featureGate/FeatureGateService.js'
import { RestrictionRepositoryImpl } from '@/domains/_sharedDomains/infrastructure/repository/RestrictionRepositoryImpl.js'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5分

export const featureGateService = new FeatureGateService(
    new RestrictionRepositoryImpl(prisma),
    CACHE_TTL_MS,
)
