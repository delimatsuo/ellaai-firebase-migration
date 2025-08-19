import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest, requireCompanyAccess } from '../middleware/auth';
import { AppError } from '../utils/errors';
import { ResultsAnalyticsService } from '../services/resultsAnalyticsService';

const router = Router();
const analyticsService = new ResultsAnalyticsService();

// GET /api/analytics/candidate-results - Get candidate results with analytics
router.get('/candidate-results', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      candidateId,
      companyId,
      assessmentId,
      status,
      difficulty,
      startDate,
      endDate,
      includeInProgress = false,
      limit = 20,
      offset = 0
    } = req.query as any;

    // Authorization check
    if (req.user?.role === 'candidate') {
      // Candidates can only see their own results
      if (candidateId && candidateId !== req.user.uid) {
        throw new AppError('Access denied', 403);
      }
    } else if (companyId) {
      // Company users need company access
      if (req.user?.role !== 'admin' && 
          !req.user?.companyAccess?.includes(companyId) && 
          req.user?.companyId !== companyId) {
        throw new AppError('Access to company denied', 403);
      }
    }

    const query = {
      candidateId: req.user?.role === 'candidate' ? req.user.uid : candidateId,
      companyId,
      assessmentId,
      status,
      difficulty,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeInProgress: includeInProgress === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const results = await analyticsService.getCandidateResults(query);
    res.json(results);

  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/candidate-results/:id - Get detailed candidate result
router.get('/candidate-results/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await analyticsService.getCandidateResultDetail(id);

    // Authorization check
    if (req.user?.role === 'candidate') {
      if (result.candidateId !== req.user.uid) {
        throw new AppError('Access denied', 403);
      }
    } else if (req.user?.role !== 'admin') {
      if (!req.user?.companyAccess?.includes(result.companyId) && 
          req.user?.companyId !== result.companyId) {
        throw new AppError('Access denied', 403);
      }
    }

    res.json(result);

  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/assessments/:id - Get assessment analytics
router.get('/assessments/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id: assessmentId } = req.params;
    const {
      startDate,
      endDate,
      includeQuestionBreakdown = false,
      includeSkillAnalysis = false
    } = req.query as any;

    // Check access to assessment
    const assessment = await admin.firestore().collection('assessments').doc(assessmentId).get();
    if (!assessment.exists) {
      throw new AppError('Assessment not found', 404);
    }

    const assessmentData = assessment.data()!;
    
    // Authorization check
    if (req.user?.role !== 'admin' && 
        !req.user?.companyAccess?.includes(assessmentData.companyId) && 
        req.user?.companyId !== assessmentData.companyId) {
      throw new AppError('Access denied', 403);
    }

    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeQuestionBreakdown: includeQuestionBreakdown === 'true',
      includeSkillAnalysis: includeSkillAnalysis === 'true'
    };

    const analytics = await analyticsService.getAssessmentAnalytics(assessmentId, options);
    res.json(analytics);

  } catch (error) {
    next(error);
  }
});

// POST /api/analytics/assessments/compare - Compare multiple assessments
router.post('/assessments/compare', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { assessmentIds, startDate, endDate } = req.body;

    if (!assessmentIds || !Array.isArray(assessmentIds) || assessmentIds.length === 0) {
      throw new AppError('assessmentIds is required and must be a non-empty array', 400);
    }

    // Check access to all assessments
    const assessments = await Promise.all(
      assessmentIds.map((id: string) => 
        admin.firestore().collection('assessments').doc(id).get()
      )
    );

    for (const assessment of assessments) {
      if (!assessment.exists) {
        throw new AppError('One or more assessments not found', 404);
      }

      const assessmentData = assessment.data()!;
      if (req.user?.role !== 'admin' && 
          !req.user?.companyAccess?.includes(assessmentData.companyId) && 
          req.user?.companyId !== assessmentData.companyId) {
        throw new AppError('Access denied to one or more assessments', 403);
      }
    }

    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    // Get analytics for each assessment
    const assessmentAnalytics = await Promise.all(
      assessmentIds.map((id: string) => 
        analyticsService.getAssessmentAnalytics(id, options)
      )
    );

    // Generate comparison data
    const comparison = {
      scoreComparison: assessmentAnalytics.map(a => ({
        assessmentId: a.assessmentId,
        assessmentTitle: a.assessmentTitle,
        averageScore: a.averageScore,
        medianScore: a.medianScore
      })),
      timeComparison: assessmentAnalytics.map(a => ({
        assessmentId: a.assessmentId,
        assessmentTitle: a.assessmentTitle,
        averageTime: a.timeAnalytics.averageTimeSpent,
        medianTime: a.timeAnalytics.medianTimeSpent
      })),
      completionComparison: assessmentAnalytics.map(a => ({
        assessmentId: a.assessmentId,
        assessmentTitle: a.assessmentTitle,
        completionRate: a.completionRate,
        passRate: a.passRate
      })),
      difficultyComparison: assessmentAnalytics.map(a => ({
        assessmentId: a.assessmentId,
        assessmentTitle: a.assessmentTitle,
        difficulty: a.difficultyAnalytics
      }))
    };

    res.json({
      assessments: assessmentAnalytics,
      comparison
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/companies/:id - Get company analytics
router.get('/companies/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id: companyId } = req.params;
    const {
      startDate,
      endDate,
      includeTeamBreakdown = false,
      includeSkillAnalysis = false,
      includeTrends = false
    } = req.query as any;

    // Authorization check
    if (req.user?.role !== 'admin' && 
        !req.user?.companyAccess?.includes(companyId) && 
        req.user?.companyId !== companyId) {
      throw new AppError('Access denied', 403);
    }

    if (!startDate || !endDate) {
      throw new AppError('startDate and endDate are required', 400);
    }

    const options = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      includeTeamBreakdown: includeTeamBreakdown === 'true',
      includeSkillAnalysis: includeSkillAnalysis === 'true',
      includeTrends: includeTrends === 'true'
    };

    const analytics = await analyticsService.getCompanyAnalytics(companyId, options);
    res.json(analytics);

  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/companies/:id/benchmark - Get company benchmark data
router.get('/companies/:id/benchmark', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id: companyId } = req.params;
    const { industry, companySize, metrics } = req.query as any;

    // Authorization check
    if (req.user?.role !== 'admin' && 
        !req.user?.companyAccess?.includes(companyId) && 
        req.user?.companyId !== companyId) {
      throw new AppError('Access denied', 403);
    }

    // Get company analytics for the last quarter
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    const companyAnalytics = await analyticsService.getCompanyAnalytics(companyId, {
      startDate,
      endDate,
      includeTeamBreakdown: false,
      includeSkillAnalysis: false,
      includeTrends: false
    });

    // Mock benchmark data - in production, this would come from aggregated industry data
    const benchmark = {
      industry: {
        averageScore: 72.5,
        completionRate: 78.3,
        hiringRate: 15.2,
        averageTime: 42.1
      },
      size: {
        averageScore: 74.1,
        completionRate: 80.1,
        hiringRate: 18.7,
        averageTime: 38.9
      },
      overall: {
        averageScore: 73.2,
        completionRate: 79.1,
        hiringRate: 16.8,
        averageTime: 40.5
      }
    };

    const comparison = [
      {
        metric: 'Average Score',
        company: companyAnalytics.overview.averageScore,
        industry: benchmark.industry.averageScore,
        percentile: companyAnalytics.overview.averageScore > benchmark.industry.averageScore ? 75 : 45
      },
      {
        metric: 'Hiring Rate',
        company: companyAnalytics.overview.hiringRate,
        industry: benchmark.industry.hiringRate,
        percentile: companyAnalytics.overview.hiringRate > benchmark.industry.hiringRate ? 65 : 35
      }
    ];

    res.json({
      company: companyAnalytics,
      benchmark,
      comparison
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/analytics/reports/generate - Generate report
router.post('/reports/generate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config, entityIds } = req.body;

    if (!config || !entityIds || !Array.isArray(entityIds)) {
      throw new AppError('config and entityIds are required', 400);
    }

    // Create a report generation job
    const reportJob = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user!.uid,
      config,
      entityIds,
      status: 'queued' as const,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      progress: 0
    };

    await admin.firestore().collection('report-jobs').doc(reportJob.id).set(reportJob);

    // In a real implementation, this would trigger a background job
    // For now, simulate immediate processing for simple reports
    if (entityIds.length <= 10) {
      // Small report - process immediately
      setTimeout(async () => {
        try {
          await admin.firestore().collection('report-jobs').doc(reportJob.id).update({
            status: 'ready',
            progress: 100,
            downloadUrl: `https://example.com/reports/${reportJob.id}.${config.format}`,
            filename: `report_${Date.now()}.${config.format}`,
            size: 1024 * 1024 * 2, // 2MB mock size
            completedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (error) {
          console.error('Failed to update report job:', error);
        }
      }, 5000); // 5 second delay

      res.json({
        reportId: reportJob.id,
        status: 'processing',
        estimatedTime: 5
      });
    } else {
      // Large report - queue for background processing
      res.json({
        reportId: reportJob.id,
        status: 'queued',
        estimatedTime: entityIds.length * 2 // rough estimate
      });
    }

  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/reports/:id - Get report status
router.get('/reports/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const reportDoc = await admin.firestore().collection('report-jobs').doc(id).get();
    
    if (!reportDoc.exists) {
      throw new AppError('Report not found', 404);
    }

    const reportData = reportDoc.data()!;

    // Check access
    if (reportData.userId !== req.user!.uid && req.user?.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const report = {
      id: reportDoc.id,
      type: reportData.config?.type || 'unknown',
      format: reportData.config?.format || 'pdf',
      filename: reportData.filename || `report_${reportDoc.id}.pdf`,
      size: reportData.size || 0,
      createdAt: reportData.createdAt?.toDate() || new Date(),
      expiresAt: reportData.expiresAt?.toDate() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      downloadUrl: reportData.downloadUrl || '',
      status: reportData.status || 'queued',
      error: reportData.error
    };

    res.json(report);

  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/reports - List reports
router.get('/reports', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, type, status, limit = 10, offset = 0 } = req.query as any;

    let query = admin.firestore().collection('report-jobs') as admin.firestore.Query;

    // Filter by user (candidates can only see their own reports)
    if (req.user?.role === 'candidate' || userId) {
      const targetUserId = req.user?.role === 'candidate' ? req.user.uid : userId;
      query = query.where('userId', '==', targetUserId);
    }

    if (type) {
      query = query.where('config.type', '==', type);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc')
                 .limit(parseInt(limit))
                 .offset(parseInt(offset));

    const snapshot = await query.get();
    
    const reports = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.config?.type || 'unknown',
        format: data.config?.format || 'pdf',
        filename: data.filename || `report_${doc.id}.pdf`,
        size: data.size || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        downloadUrl: data.downloadUrl || '',
        status: data.status || 'queued',
        error: data.error
      };
    });

    res.json({
      reports,
      total: snapshot.size
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/reports/:id/download - Download report
router.get('/reports/:id/download', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const reportDoc = await admin.firestore().collection('report-jobs').doc(id).get();
    
    if (!reportDoc.exists) {
      throw new AppError('Report not found', 404);
    }

    const reportData = reportDoc.data()!;

    // Check access
    if (reportData.userId !== req.user!.uid && req.user?.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    if (reportData.status !== 'ready') {
      throw new AppError('Report is not ready for download', 400);
    }

    // In a real implementation, this would serve the actual file
    // For now, return a mock response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportData.filename}"`);
    res.send(Buffer.from('Mock PDF content'));

  } catch (error) {
    next(error);
  }
});

// DELETE /api/analytics/reports/:id - Delete report
router.delete('/reports/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const reportDoc = await admin.firestore().collection('report-jobs').doc(id).get();
    
    if (!reportDoc.exists) {
      throw new AppError('Report not found', 404);
    }

    const reportData = reportDoc.data()!;

    // Check access
    if (reportData.userId !== req.user!.uid && req.user?.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    await reportDoc.ref.delete();

    res.status(204).send();

  } catch (error) {
    next(error);
  }
});

// POST /api/analytics/bulk-export - Bulk export
router.post('/bulk-export', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { entityIds, entityType, format, includeAnalytics = false } = req.body;

    if (!entityIds || !Array.isArray(entityIds) || entityIds.length === 0) {
      throw new AppError('entityIds is required and must be a non-empty array', 400);
    }

    if (!['candidates', 'assessments', 'companies'].includes(entityType)) {
      throw new AppError('entityType must be one of: candidates, assessments, companies', 400);
    }

    if (!['excel', 'csv', 'json'].includes(format)) {
      throw new AppError('format must be one of: excel, csv, json', 400);
    }

    // Create export job
    const exportJob = {
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user!.uid,
      entityIds,
      entityType,
      format,
      includeAnalytics,
      status: 'queued' as const,
      progress: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore().collection('export-jobs').doc(exportJob.id).set(exportJob);

    res.json({
      exportId: exportJob.id,
      status: 'queued',
      estimatedTime: Math.ceil(entityIds.length / 10) * 60 // rough estimate in seconds
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/bulk-export/:id - Get export status
router.get('/bulk-export/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const exportDoc = await admin.firestore().collection('export-jobs').doc(id).get();
    
    if (!exportDoc.exists) {
      throw new AppError('Export job not found', 404);
    }

    const exportData = exportDoc.data()!;

    // Check access
    if (exportData.userId !== req.user!.uid && req.user?.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    res.json({
      id: exportDoc.id,
      status: exportData.status || 'queued',
      progress: exportData.progress || 0,
      downloadUrl: exportData.downloadUrl,
      error: exportData.error
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/analytics/custom-query - Execute custom query
router.post('/custom-query', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { collection, filters, aggregations, limit, orderBy } = req.body;

    // Only admins can execute custom queries
    if (req.user?.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }

    if (!collection) {
      throw new AppError('collection is required', 400);
    }

    // Validate collection name (security measure)
    const allowedCollections = ['assessment-attempts', 'assessments', 'users', 'companies'];
    if (!allowedCollections.includes(collection)) {
      throw new AppError('Invalid collection name', 400);
    }

    let query = admin.firestore().collection(collection) as admin.firestore.Query;

    // Apply filters
    if (filters && Array.isArray(filters)) {
      for (const filter of filters) {
        if (filter.field && filter.operator && filter.value !== undefined) {
          query = query.where(filter.field, filter.operator as any, filter.value);
        }
      }
    }

    // Apply ordering
    if (orderBy && Array.isArray(orderBy)) {
      for (const order of orderBy) {
        if (order.field && order.direction) {
          query = query.orderBy(order.field, order.direction as any);
        }
      }
    }

    // Apply limit
    if (limit && typeof limit === 'number' && limit > 0) {
      query = query.limit(Math.min(limit, 1000)); // Cap at 1000 for safety
    }

    const snapshot = await query.get();
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate aggregations if requested
    let aggregationResults: Record<string, any> = {};
    if (aggregations && Array.isArray(aggregations)) {
      for (const agg of aggregations) {
        if (agg.type && agg.field) {
          switch (agg.type) {
            case 'count':
              aggregationResults[`count_${agg.field}`] = results.length;
              break;
            case 'sum':
              aggregationResults[`sum_${agg.field}`] = results.reduce((sum, item) => 
                sum + (parseFloat(item[agg.field]) || 0), 0);
              break;
            case 'avg':
              const values = results.map(item => parseFloat(item[agg.field]) || 0);
              aggregationResults[`avg_${agg.field}`] = values.length > 0 ? 
                values.reduce((sum, val) => sum + val, 0) / values.length : 0;
              break;
            case 'min':
              const minValues = results.map(item => parseFloat(item[agg.field]) || 0);
              aggregationResults[`min_${agg.field}`] = minValues.length > 0 ? 
                Math.min(...minValues) : 0;
              break;
            case 'max':
              const maxValues = results.map(item => parseFloat(item[agg.field]) || 0);
              aggregationResults[`max_${agg.field}`] = maxValues.length > 0 ? 
                Math.max(...maxValues) : 0;
              break;
          }
        }
      }
    }

    res.json({
      results,
      aggregations: Object.keys(aggregationResults).length > 0 ? aggregationResults : undefined,
      total: results.length
    });

  } catch (error) {
    next(error);
  }
});

export { router as analyticsRoutes };