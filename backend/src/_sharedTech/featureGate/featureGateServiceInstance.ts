/**
 * FeatureGateService singleton — アプリ全体で共有
 */
import { prisma } from '@/_sharedTech/db/client.js'
import { FeatureGateService } from '@/domains/_sharedDomains/featureGate/FeatureGateService.js'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5分

export const featureGateService = new FeatureGateService(prisma, CACHE_TTL_MS)
