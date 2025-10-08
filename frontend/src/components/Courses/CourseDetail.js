import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  BookOpenIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../Common/LoadingSpinner';
import CourseContentDisplay from './CourseContentDisplay';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [instructorName, setInstructorName] = useState('Loading...');

  const fetchCourseDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/courses/${id}/details`);
      setCourse(response.data);
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast.error('Could not load course details.');
      navigate('/courses');
    } finally {
      if (loading) setLoading(false);
    }
  }, [id, navigate, loading]);

  const checkEnrollmentStatus = useCallback(async () => {
    if (user?.role !== 'student') return;
    try {
      const response = await axios.get(`/api/enrollments/student/${user._id}`);
      const enrolled = response.data.some(e => e.course._id === id && e.status === 'enrolled');
      setIsEnrolled(enrolled);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  }, [id, user]);
  
  useEffect(() => {
    fetchCourseDetails();
    if (user) {
      checkEnrollmentStatus();
    }
  }, [user, fetchCourseDetails, checkEnrollmentStatus]);

  useEffect(() => {
    const fetchInstructorName = async () => {
      if (course && course.instructor) {
        try {
          const response = await axios.get(`/api/users/${course.instructor}`);
          const instructor = response.data;
          setInstructorName(`${instructor.firstName} ${instructor.lastName}`);
        } catch (error) {
          console.error("Failed to fetch instructor name", error);
          setInstructorName("Unknown Instructor");
        }
      }
    };
    fetchInstructorName();
  }, [course]);

  const handleEnroll = async () => {
    if (user?.role !== 'student') {
        toast.error("Only students can enroll in courses.");
        return;
    }
    setEnrollmentLoading(true);
    try {
      await axios.post('/api/enrollments', { courseId: id });
      setIsEnrolled(true);
      toast.success('Successfully enrolled in course!');
      fetchCourseDetails();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to enroll';
      toast.error(message);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleUnenroll = async () => {
    try {
      const enrollments = await axios.get(`/api/enrollments/student/${user._id}`);
      const enrollment = enrollments.data.find(e => e.course._id === id);
      if (enrollment) {
        await axios.delete(`/api/enrollments/${enrollment._id}`);
        setIsEnrolled(false);
        toast.success('Successfully unenrolled from course');
        fetchCourseDetails();
      }
    } catch (error) {
      toast.error('Failed to unenroll from course');
    }
  };

  const handleApproveCourse = async () => {
    try {
      await axios.put(`/api/courses/${id}/approve`);
      toast.success('Course approved successfully!');
      fetchCourseDetails();
    } catch (error) {
      toast.error('Failed to approve course');
    }
  };
  
  if (loading) { return <LoadingSpinner />; }
  if (!course) { return <div className="text-center py-12"><h2>Course not found</h2></div>; }

  const canEdit = user?.role === 'instructor' && String(course.instructor) === String(user._id);
  const isAdmin = user?.role === 'admin';
  const canApprove = user?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
           <div className="flex-1">
             <div className="flex items-center space-x-4 mb-4">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                  <p className="text-lg text-gray-600">{course.courseCode}</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">{course.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <UserIcon className="h-5 w-5 mr-3" />
                  <span>Instructor: {instructorName}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-3" />
                  <span>{course.credits} Credits • {course.level}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <CurrencyDollarIcon className="h-5 w-5 mr-3" />
                  <span>${course.fees}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="h-5 w-5 mr-3" />
                  <span>{course.currentEnrollment}/{course.maxStudents} enrolled</span>
                </div>
              </div>
           </div>
           <div className="mt-6 lg:mt-0 lg:ml-6 flex flex-col space-y-3 shrink-0">
            {canEdit && (
                <>
                    <Link to={`/courses/${id}/edit`} className="btn btn-secondary flex items-center justify-center">
                        <PencilIcon className="h-5 w-5 mr-2" /> Edit Course Info
                    </Link>
                    <Link to={`/courses/${id}/manage-content`} className="btn btn-primary flex items-center justify-center">
                        <ListBulletIcon className="h-5 w-5 mr-2" /> Manage Content
                    </Link>
                </>
            )}
            {canApprove && (
                <>
                    {!course.isApproved && (
                        <button onClick={handleApproveCourse} className="btn btn-primary flex items-center justify-center">
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Approve Course
                        </button>
                    )}
                    <button className="btn btn-danger flex items-center justify-center">
                        <TrashIcon className="h-5 w-5 mr-2" /> Deactivate Course
                    </button>
                </>
            )}
            {user?.role === 'student' && (
                 <>
                    {!isEnrolled ? (
                        <button onClick={handleEnroll} disabled={enrollmentLoading || course.currentEnrollment >= course.maxStudents || !course.isApproved} className="btn btn-primary disabled:opacity-50">
                            {enrollmentLoading ? 'Enrolling...' : !course.isApproved ? 'Pending Approval' : course.currentEnrollment >= course.maxStudents ? 'Course Full' : 'Enroll Now'}
                        </button>
                    ) : (
                        <button onClick={handleUnenroll} className="btn btn-danger">Unenroll</button>
                    )}
                </>
            )}
           </div>
        </div>
      </div>
      <CourseContentDisplay courseId={course._id} modules={course.modules || []} isEnrolled={isEnrolled} canEdit={canEdit} isAdmin={isAdmin} onEnroll={handleEnroll} enrollmentLoading={enrollmentLoading} courseApproved={course.isApproved} userRole={user?.role} />
      {course.prerequisites?.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Prerequisites</h2>
          <ul className="list-disc list-inside space-y-1">
            {course.prerequisites.map((prereq, index) => (
              <li key={index} className="text-gray-700">{prereq}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;