import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const university = await prisma.university.findUnique({
            where: { id: params.id },
            include: {
                colleges: {
                    include: {
                        departments: {
                            include: {
                                _count: {
                                    select: {
                                        applications: true
                                    }
                                },
                                applications: {
                                    include: {
                                        user: {
                                            select: {
                                                overall_gpa: true
                                            }
                                        }
                                    },
                                    orderBy: {
                                        user: {
                                            overall_gpa: 'desc'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        if (!university) {
            return new Response('University not found', { status: 404 });
        }
        
        return json(university);
    } catch (error) {
        console.error('Error fetching university:', error);
        return new Response('Internal server error', { status: 500 });
    }
};
