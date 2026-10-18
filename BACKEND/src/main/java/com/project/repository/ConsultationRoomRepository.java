package com.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.entity.ConsultationRoom;

@Repository
public interface ConsultationRoomRepository extends JpaRepository<ConsultationRoom, Long> {

    Optional<ConsultationRoom> findByRoomId(String roomId);

    Optional<ConsultationRoom> findByAppointment_Id(Long appointmentId);

    List<ConsultationRoom> findByDoctor_IdAndStatus(Long doctorId, String status);

    List<ConsultationRoom> findByPatient_IdAndStatus(Long patientId, String status);

    List<ConsultationRoom> findByStatus(String status);
}
