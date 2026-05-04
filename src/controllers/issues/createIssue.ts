import { Request, Response } from 'express';

// import { prisma } from '../../lib/prisma';

/**
 * POST /issues
 *
 * Public bug-report submission. No authentication — anyone with the URL
 * can file. Admin-gated read and triage routes land in Sprint 4.
 *
 * Request body (proposed shape — adjust as the team's design evolves):
 *   {
 *     "title": string,                  // required, non-empty
 *     "description": string,            // required, non-empty
 *     "stepsToReproduce"?: string,      // optional
 *     "reporterEmail"?: string          // optional contact for follow-up
 *   }
 *
 * Response: 201 Created with the persisted Issue. Returns 400 on
 * validation failure with { error: "<message>" }.
 *
 * TODO (db owner): once the Issue model lands in prisma/schema.prisma,
 * replace the 501 stub below with a prisma.issue.create(...) call.
 */
export const createIssue = async (request: Request, response: Response): Promise<void> => {
  const { title, description, stepsToReproduce, reporterEmail } = request.body ?? {};

  if (typeof title !== 'string' || title.trim() === '') {
    response.status(400).json({ error: 'title is required' });
    return;
  }
  if (typeof description !== 'string' || description.trim() === '') {
    response.status(400).json({ error: 'description is required' });
    return;
  }
  if (stepsToReproduce !== undefined && typeof stepsToReproduce !== 'string') {
    response.status(400).json({ error: 'stepsToReproduce must be a string' });
    return;
  }
  if (reporterEmail !== undefined && typeof reporterEmail !== 'string') {
    response.status(400).json({ error: 'reporterEmail must be a string' });
    return;
  }

  // const issue = await prisma.issue.create({
  //   data: {
  //     title: title.trim(),
  //     description: description.trim(),
  //     stepsToReproduce: stepsToReproduce?.trim() ?? null,
  //     reporterEmail: reporterEmail?.trim() ?? null,
  //   },
  // });
  // response.status(201).json(issue);

  response.status(501).json({
    error: 'Not implemented',
    detail: 'Issue model and persistence land with the Sprint 3 schema migration.',
  });
};
